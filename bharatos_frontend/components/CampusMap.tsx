'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import SimulationForm, { SimulationParams } from './SimulationForm';
import TrafficSimulationForm, { TrafficParams } from './TrafficSimulationForm';
import Sidebar, { DashboardMode } from './Sidebar';
import TopStatusBar from './TopStatusBar';
import InspectorPanel from './InspectorPanel';

const CENTER_LNG = 81.8603;
const CENTER_LAT = 25.4012;

// Loads real Prayagraj building footprints (fetched from OpenStreetMap via
// scripts/fetch-buildings.mjs, saved to public/data/buildings.geojson).
// Falls back to the procedural grid below if that file doesn't exist yet,
// so the map never breaks — it just won't be geographically accurate until
// `node scripts/fetch-buildings.mjs` has been run once.
async function loadBuildingFootprints(centerLat: number, centerLng: number): Promise<GeoJSON.FeatureCollection> {
  try {
    const res = await fetch('/data/buildings.geojson');
    if (!res.ok) throw new Error(`buildings.geojson not found (${res.status})`);
    const data = await res.json();
    if (!data?.features?.length) throw new Error('buildings.geojson is empty');
    return data;
  } catch (err) {
    console.warn('Falling back to procedural buildings — run `node scripts/fetch-buildings.mjs` for real footprints.', err);
    return generateBuildingGrid(centerLat, centerLng);
  }
}

function generateBuildingGrid(centerLat: number, centerLng: number, rows = 40, cols = 40, spacingM = 35) {
  const features: any[] = [];
  const mLat = 1 / 110_540;
  const mLng = 1 / (111_320 * Math.cos((centerLat * Math.PI) / 180));

  for (let i = -rows / 2; i < rows / 2; i++) {
    for (let j = -cols / 2; j < cols / 2; j++) {
      if (Math.random() < 0.25) continue;
      const baseLat = centerLat + i * spacingM * mLat;
      const baseLng = centerLng + j * spacingM * mLng;
      const w = (14 + Math.random() * 14) * mLng;
      const h = (14 + Math.random() * 14) * mLat;
      const height = 10 + Math.random() * 35; // taller + more varied, reads as a real skyline

      features.push({
        type: 'Feature',
        properties: { height },
        geometry: {
          type: 'Polygon',
          coordinates: [[[baseLng, baseLat], [baseLng + w, baseLat], [baseLng + w, baseLat + h], [baseLng, baseLat + h], [baseLng, baseLat]]],
        },
      });
    }
  }
  return { type: 'FeatureCollection', features } as GeoJSON.FeatureCollection;
}

function estimateTrafficFactors(params: TrafficParams, point: any) {
  const isRush = (params.hour_of_day >= 8 && params.hour_of_day <= 10) || (params.hour_of_day >= 17 && params.hour_of_day <= 20);
  const factors: { label: string; value: number }[] = [];
  if (isRush) factors.push({ label: 'Rush hour', value: 35 });
  if (params.rainfall_mm > 0) factors.push({ label: 'Rainfall', value: Math.min(40, Math.round(params.rainfall_mm * 1.3)) });
  if (params.visibility_m < 1000) factors.push({ label: 'Low visibility (fog)', value: Math.round(((1000 - params.visibility_m) / 1000) * 60) });
  if (params.scenario_type !== 'none') factors.push({ label: params.scenario_type.replace(/_/g, ' '), value: 45 });
  if (point.is_bridge_segment) factors.push({ label: 'Bridge chokepoint', value: 30 });
  if (point.near_railway_crossing) factors.push({ label: 'Railway crossing nearby', value: 20 });
  if (!factors.length) factors.push({ label: 'Baseline conditions', value: 20 });
  return factors.sort((a, b) => b.value - a.value).slice(0, 4);
}

function estimatePollutionFactors(params: SimulationParams, cell: any, baseline: number) {
  const plume = Math.max(0, cell.concentration - baseline);
  return [
    { label: 'Factory plume contribution', value: Math.min(95, Math.round(plume)) },
    { label: 'Wind dispersion', value: Math.max(5, Math.round(40 - params.wind_speed * 4)) },
    { label: 'Stack height effect', value: Math.max(5, Math.round(50 - params.stack_height_m)) },
    { label: 'Baseline city pollution', value: Math.round(baseline) },
  ].sort((a, b) => b.value - a.value).slice(0, 4);
}

export default function CityMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const [mode, setMode] = useState<DashboardMode>('traffic');
  const modeRef = useRef<DashboardMode>('traffic'); // avoids the stale-closure bug in the map click handler
  const [recommendation, setRecommendation] = useState<any>(null);
  const [avgCongestion, setAvgCongestion] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [inspector, setInspector] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const baselineById = useRef<Record<string, number>>({});

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            maxzoom: 18,
            attribution: 'Esri World Imagery',
          },
        },
        layers: [{ id: 'satellite-layer', type: 'raster', source: 'satellite' }],
        light: { anchor: 'viewport', color: '#ffffff', intensity: 0.5, position: [1.5, 90, 40] },
      },
      center: [CENTER_LNG, CENTER_LAT],
      zoom: 17.2, // zoomed in enough that 3D buildings actually read as buildings
      pitch: 60,
      bearing: -20,
      antialias: true,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Add the source empty first so the layer/map never blocks on the fetch,
      // then populate it once real (or fallback) footprints resolve.
      map.current.addSource('buildings', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current.addLayer({
        id: 'buildings-3d',
        type: 'fill-extrusion',
        source: 'buildings',
        paint: {
          'fill-extrusion-color': '#f5f2e8',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.95,
          'fill-extrusion-vertical-gradient': true, // gives the sides real shading, not flat color
        },
      });

      loadBuildingFootprints(CENTER_LAT, CENTER_LNG).then((data) => {
        (map.current?.getSource('buildings') as maplibregl.GeoJSONSource)?.setData(data);
      });

      map.current.addSource('sim-grid', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current.addLayer({
        id: 'sim-grid-layer',
        type: 'circle',
        source: 'sim-grid',
        paint: {
          'circle-radius': 10,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.85,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.current.on('click', 'sim-grid-layer', (e) => {
        const f = e.features?.[0];
        if (f) handlePointClick(f.properties, modeRef.current);
      });

      map.current.on('mouseenter', 'sim-grid-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'sim-grid-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    return () => { map.current?.remove(); map.current = null; };
  }, []);

  function handlePointClick(props: any, currentMode: DashboardMode) {
    if (currentMode === 'traffic') {
      const riskLevel = props.congestion_percent > 70 ? 'high' : props.congestion_percent > 40 ? 'moderate' : 'low';
      setInspector({
        cellId: `PRY_TRAF_${props.id}`,
        title: `Road segment [${props.id}]`,
        riskLevel,
        stats: [
          { label: 'Congestion', value: `${props.congestion_percent}%` },
          { label: 'Scenario', value: (props.scenario_type ?? '').replace(/_/g, ' ') },
          { label: 'Hour', value: `${props.hour_of_day}:00` },
          { label: 'Bridge segment', value: props.is_bridge_segment ? 'Yes' : 'No' },
        ],
        factors: JSON.parse(props.factors),
        barColorClass: 'bg-blue-500',
      });
    } else {
      const riskLevel = props.concentration > 150 ? 'high' : props.concentration > 60 ? 'moderate' : 'low';
      setInspector({
        cellId: `PRY_POLL_${props.id}`,
        title: `Grid cell [${props.id}]`,
        riskLevel,
        stats: [
          { label: 'PM2.5 (projected)', value: `${props.concentration} µg/m³` },
          { label: 'Baseline PM2.5', value: `${props.baseline} µg/m³` },
        ],
        factors: JSON.parse(props.factors),
        barColorClass: 'bg-amber-500',
      });
    }
  }

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function runPollutionSimulation(params: SimulationParams) {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchWithTimeout('http://localhost:8000/api/pollution/factory-impact/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error(text);
        setErrorMessage(`Backend error (${response.status}). Check the Django terminal for the full traceback.`);
        return;
      }
      const result = await response.json();
      setRecommendation(result.recommendation);
      setAvgCongestion(null);
      setInspector(null);

      baselineById.current = Object.fromEntries(result.baseline_grid.map((c: any) => [c.id, c.concentration]));

      const features = result.projected_grid.map((cell: any) => {
        const baseline = baselineById.current[cell.id] ?? 25;
        const color = cell.concentration > 150 ? '#ef4444' : cell.concentration > 60 ? '#f59e0b' : '#22c55e';
        return {
          type: 'Feature',
          properties: { ...cell, baseline, color, factors: JSON.stringify(estimatePollutionFactors(params, cell, baseline)) },
          geometry: { type: 'Point', coordinates: [cell.lng, cell.lat] },
        };
      });
      (map.current?.getSource('sim-grid') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features });
    } catch (err: any) {
      console.error('Network error:', err);
      setErrorMessage(
        err?.name === 'AbortError'
          ? 'Request timed out after 30s. The backend may be stuck — check the Django terminal.'
          : 'Could not reach the backend at localhost:8000. Is `manage.py runserver` running?'
      );
    } finally {
      setLoading(false);
    }
  }

  async function runTrafficSimulation(params: TrafficParams) {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchWithTimeout('http://localhost:8000/api/traffic/predict/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error(text);
        setErrorMessage(`Backend error (${response.status}). Check the Django terminal for the full traceback.`);
        return;
      }
      const result = await response.json();
      setAvgCongestion(result.avg_congestion_percent);
      setRecommendation(null);
      setInspector(null);

      const features = result.grid.map((cell: any) => {
        const color = cell.congestion_percent > 70 ? '#ef4444' : cell.congestion_percent > 40 ? '#f59e0b' : '#22c55e';
        return {
          type: 'Feature',
          properties: { ...cell, ...params, color, factors: JSON.stringify(estimateTrafficFactors(params, cell)) },
          geometry: { type: 'Point', coordinates: [cell.lng, cell.lat] },
        };
      });
      (map.current?.getSource('sim-grid') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features });
    } catch (err: any) {
      console.error('Network error:', err);
      setErrorMessage(
        err?.name === 'AbortError'
          ? 'Request timed out after 30s. The backend may be stuck — check the Django terminal.'
          : 'Could not reach the backend at localhost:8000. Is `manage.py runserver` running?'
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode(newMode: DashboardMode) {
    setMode(newMode);
    setRecommendation(null);
    setAvgCongestion(null);
    setInspector(null);
    (map.current?.getSource('sim-grid') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features: [] });
  }

  return (
    <div className="flex w-full h-screen">
      <Sidebar mode={mode} onModeChange={switchMode} onOpenFactoryTool={() => switchMode('pollution')} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopStatusBar mode={mode} isRunning={loading} avgCongestion={avgCongestion} recommendation={recommendation} />
        <div className="relative flex-1">
          <div ref={mapContainer} className="w-full h-full" />
          {mode === 'pollution' ? (
            <SimulationForm onRun={runPollutionSimulation} loading={loading} />
          ) : (
            <TrafficSimulationForm onRun={runTrafficSimulation} loading={loading} />
          )}
          {inspector && <InspectorPanel {...inspector} onClose={() => setInspector(null)} />}
          {errorMessage && (
            <div className="absolute top-4 right-4 max-w-sm bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg shadow-lg px-4 py-3 z-[1000] flex items-start gap-2">
              <span className="flex-1">{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600 font-bold leading-none">×</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}