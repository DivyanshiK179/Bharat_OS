'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import SimulationForm, { SimulationParams } from './SimulationForm';
import TrafficSimulationForm, { TrafficParams } from './TrafficSimulationForm';
import Sidebar, { DashboardMode } from './Sidebar';
import TopStatusBar from './TopStatusBar';
import InspectorPanel from './InspectorPanel';

// Verified GIS Benchmarks across Prayagraj [Longitude, Latitude]
const CAMERA_PRESETS = [
  {
    label: 'New Yamuna Bridge',
    center: [81.8613, 25.4272] as [number, number], // Syama Prasad Mukherjee Setu
    zoom: 17.5,
    pitch: 60,
    bearing: 30,
  },
  {
    label: 'Old Naini Bridge',
    center: [81.85028, 25.42389] as [number, number], // Historic Double-Deck Bridge
    zoom: 17.5,
    pitch: 58,
    bearing: -30,
  },
  {
    label: 'Sangam Confluence',
    center: [81.8795, 25.4290] as [number, number], // Exact Confluence Water Channel
    zoom: 17.2,
    pitch: 52,
    bearing: 30,
  },
  {
    label: 'Civil Lines (MG Marg)',
    center: [81.8340, 25.4528] as [number, number], // Subhash Chauraha
    zoom: 17.4,
    pitch: 55,
    bearing: 0,
  },
  {
    label: 'Naini Industrial Hub',
    center: [81.8680, 25.3820] as [number, number], // Industrial Cluster
    zoom: 17.0,
    pitch: 60,
    bearing: -15,
  },
  {
    label: 'Aerial Overview',
    center: [81.8550, 25.4300] as [number, number],
    zoom: 13.5,
    pitch: 0,
    bearing: 0,
  },
];

const DEFAULT_LNG = 81.8340;
const DEFAULT_LAT = 25.4528;

function getPolygonCentroid(coordinates: number[][][]): [number, number] | null {
  const ring = coordinates?.[0];
  if (!ring || ring.length === 0) return null;

  let totalLng = 0;
  let totalLat = 0;
  const count = ring.length;

  for (let i = 0; i < count; i++) {
    totalLng += ring[i][0];
    totalLat += ring[i][1];
  }

  return [totalLng / count, totalLat / count];
}

async function loadBuildingFootprints(): Promise<GeoJSON.FeatureCollection> {
  try {
    const res = await fetch('/data/buildings.geojson');
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (!data?.features?.length) throw new Error();
    return data;
  } catch {
    const features: any[] = [];
    const mLat = 1 / 110_540;
    const mLng = 1 / (111_320 * Math.cos((DEFAULT_LAT * Math.PI) / 180));

    for (let i = -30; i < 30; i += 2) {
      for (let j = -30; j < 30; j += 2) {
        if (Math.random() < 0.3) continue;
        const baseLat = DEFAULT_LAT + i * 40 * mLat;
        const baseLng = DEFAULT_LNG + j * 40 * mLng;
        const w = (15 + Math.random() * 15) * mLng;
        const h = (15 + Math.random() * 15) * mLat;
        features.push({
          type: 'Feature',
          properties: { height: 8 + Math.random() * 28 },
          geometry: {
            type: 'Polygon',
            coordinates: [[[baseLng, baseLat], [baseLng + w, baseLat], [baseLng + w, baseLat + h], [baseLng, baseLat + h], [baseLng, baseLat]]],
          },
        });
      }
    }
    return { type: 'FeatureCollection', features } as GeoJSON.FeatureCollection;
  }
}

export default function CityMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const locationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const markerLabelRef = useRef<HTMLDivElement | null>(null);

  const requestIdRef = useRef(0);
  const geocodeAbortRef = useRef<AbortController | null>(null);

  const [mode, setMode] = useState<DashboardMode>('traffic');
  const modeRef = useRef<DashboardMode>('traffic');
  const [recommendation, setRecommendation] = useState<any>(null);
  const [avgCongestion, setAvgCongestion] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [inspector, setInspector] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBuildings3D, setShowBuildings3D] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [activeCameraView, setActiveCameraView] = useState('Civil Lines (MG Marg)');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [currentLocationName, setCurrentLocationName] = useState('Civil Lines (MG Marg)');
  const [currentCoords, setCurrentCoords] = useState<[number, number]>([DEFAULT_LNG, DEFAULT_LAT]);
  const [isLiveTracking, setIsLiveTracking] = useState(false);

  const baselineById = useRef<Record<string, number>>({});

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!map.current || !map.current.getLayer('buildings-3d')) return;
    map.current.setLayoutProperty('buildings-3d', 'visibility', showBuildings3D ? 'visible' : 'none');
  }, [showBuildings3D]);

  useEffect(() => {
    if (!map.current || !map.current.getLayer('sim-grid-layer')) return;
    map.current.setLayoutProperty('sim-grid-layer', 'visibility', showGrid ? 'visible' : 'none');
  }, [showGrid]);

  // Precision Location Pointer & Dynamic Marker
  const updateLocationMarker = useCallback((coords: [number, number], label: string) => {
    setCurrentCoords(coords);
    if (label) setCurrentLocationName(label);

    if (locationMarkerRef.current && markerLabelRef.current) {
      if (label) markerLabelRef.current.innerText = `📍 ${label}`;
      locationMarkerRef.current.setLngLat(coords);
    } else if (map.current) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center';

      const labelBox = document.createElement('div');
      labelBox.className =
        'absolute -top-9 whitespace-nowrap bg-slate-950/95 text-white font-semibold text-[11px] px-2.5 py-1 rounded-lg shadow-2xl backdrop-blur-md border border-slate-700/80 pointer-events-none transition-all';
      labelBox.innerText = `📍 ${label || 'Selected Point'}`;
      markerLabelRef.current = labelBox;

      const ping = document.createElement('span');
      ping.className = 'animate-ping absolute inline-flex h-7 w-7 rounded-full bg-blue-400 opacity-75';

      const dot = document.createElement('span');
      dot.className = 'relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-xl';

      el.appendChild(ping);
      el.appendChild(dot);
      el.appendChild(labelBox);

      locationMarkerRef.current = new maplibregl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat(coords)
        .addTo(map.current);
    }
  }, []);

  const resolveLocationName = useCallback(async (lat: number, lng: number, currentReqId: number): Promise<void> => {
    if (geocodeAbortRef.current) {
      geocodeAbortRef.current.abort();
    }
    geocodeAbortRef.current = new AbortController();

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: geocodeAbortRef.current.signal,
        }
      );
      const data = await res.json();

      if (currentReqId !== requestIdRef.current) return;

      const addr = data?.address;
      let finalName = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;

      if (addr) {
        const feature = addr.bridge || addr.amenity || addr.road || addr.building || addr.tourism;
        const locality = addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district;

        if (feature && locality) finalName = `${feature}, ${locality}`;
        else if (feature) finalName = `${feature}, Prayagraj`;
        else if (locality) finalName = `${locality}, Prayagraj`;
        else if (data.name) finalName = data.name;
      }

      updateLocationMarker([lng, lat], finalName);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      if (currentReqId === requestIdRef.current) {
        updateLocationMarker([lng, lat], `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
      }
    }
  }, [updateLocationMarker]);

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
            maxzoom: 19,
            attribution: 'Esri World Imagery',
          },
          osmOverlay: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
            attribution: '© OpenStreetMap',
          },
        },
        layers: [
          { id: 'satellite-layer', type: 'raster', source: 'satellite' },
          { id: 'osm-overlay', type: 'raster', source: 'osmOverlay', paint: { 'raster-opacity': 0.22 } },
        ],
        light: { anchor: 'viewport', color: '#ffffff', intensity: 0.65, position: [1.5, 90, 40] },
      },
      center: [DEFAULT_LNG, DEFAULT_LAT],
      zoom: 17.4,
      pitch: 55,
      bearing: 0,
      antialias: true,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      updateLocationMarker([DEFAULT_LNG, DEFAULT_LAT], 'Civil Lines (MG Marg)');

      map.current.addSource('buildings', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current.addLayer({
        id: 'buildings-3d',
        type: 'fill-extrusion',
        source: 'buildings',
        paint: {
          'fill-extrusion-color': '#eae6db',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.92,
          'fill-extrusion-vertical-gradient': true,
        },
      });

      loadBuildingFootprints().then((data) => {
        (map.current?.getSource('buildings') as maplibregl.GeoJSONSource)?.setData(data);
      });

      map.current.addSource('sim-grid', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current.addLayer({
        id: 'sim-grid-layer',
        type: 'circle',
        source: 'sim-grid',
        paint: {
          'circle-radius': 11,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.88,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.current.on('click', (e) => {
        const thisReqId = ++requestIdRef.current;
        const bbox: [maplibregl.PointLike, maplibregl.PointLike] = [
          [e.point.x - 6, e.point.y - 6],
          [e.point.x + 6, e.point.y + 6],
        ];

        const gridFeatures = map.current?.queryRenderedFeatures(bbox, { layers: ['sim-grid-layer'] });
        if (gridFeatures && gridFeatures.length > 0) {
          handlePointClick(gridFeatures[0].properties, modeRef.current);
          return;
        }

        const buildingFeatures = map.current?.queryRenderedFeatures(e.point, { layers: ['buildings-3d'] });
        let targetLng = e.lngLat.lng;
        let targetLat = e.lngLat.lat;

        if (buildingFeatures && buildingFeatures.length > 0) {
          const geom = buildingFeatures[0].geometry as any;
          if (geom.type === 'Polygon') {
            const centroid = getPolygonCentroid(geom.coordinates);
            if (centroid) {
              targetLng = centroid[0];
              targetLat = centroid[1];
            }
          }
        }

        updateLocationMarker([targetLng, targetLat], 'Locating point...');
        resolveLocationName(targetLat, targetLng, thisReqId);
      });

      map.current.on('mouseenter', 'sim-grid-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'sim-grid-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [resolveLocationName, updateLocationMarker]);

  function handleCameraFlyTo(preset: typeof CAMERA_PRESETS[0]) {
    requestIdRef.current++;
    setActiveCameraView(preset.label);
    updateLocationMarker(preset.center, preset.label);

    map.current?.flyTo({
      center: preset.center,
      zoom: preset.zoom,
      pitch: preset.pitch,
      bearing: preset.bearing,
      essential: true,
      duration: 1600,
    });
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        searchQuery + ', Prayagraj'
      )}&format=json&limit=5&addressdetails=1`;

      const res = await fetch(endpoint, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();

      if (data && data.length > 0) {
        setSearchResults(
          data.map((item: any) => ({
            name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }))
        );
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  }

  function handleSelectLocation(lat: number, lng: number, label: string) {
    requestIdRef.current++;
    const cleanLabel = label.split(',')[0].trim();
    updateLocationMarker([lng, lat], cleanLabel);
    setSearchResults([]);
    setSearchQuery('');

    map.current?.flyTo({
      center: [lng, lat],
      zoom: 17.5,
      pitch: 60,
      bearing: -20,
      duration: 1800,
      essential: true,
    });
  }

  function handleTrackCurrentPosition() {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLiveTracking(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const thisReqId = ++requestIdRef.current;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const coords: [number, number] = [lng, lat];

        updateLocationMarker(coords, 'Your Live GPS');
        setIsLiveTracking(false);

        map.current?.flyTo({
          center: coords,
          zoom: 18,
          pitch: 65,
          duration: 2000,
          essential: true,
        });

        resolveLocationName(lat, lng, thisReqId);
      },
      (err) => {
        setIsLiveTracking(false);
        setErrorMessage(`Location error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handlePointClick(props: any, currentMode: DashboardMode) {
    if (props.lat && props.lng) {
      updateLocationMarker([props.lng, props.lat], `Cell [${props.id}]`);
    }

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
        factors: JSON.parse(props.factors || '[]'),
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
        factors: JSON.parse(props.factors || '[]'),
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error(text);
        setErrorMessage(`Backend error (${response.status}). Check Django terminal.`);
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
          properties: {
            ...cell,
            baseline,
            color,
            factors: JSON.stringify([
              { label: 'Factory plume contribution', value: Math.min(95, Math.round(Math.max(0, cell.concentration - baseline))) },
              { label: 'Wind dispersion', value: Math.max(5, Math.round(40 - params.wind_speed * 4)) },
              { label: 'Stack height effect', value: Math.max(5, Math.round(50 - params.stack_height_m)) },
            ]),
          },
          geometry: { type: 'Point', coordinates: [cell.lng, cell.lat] },
        };
      });
      (map.current?.getSource('sim-grid') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features });
    } catch (err: any) {
      setErrorMessage(
        err?.name === 'AbortError' ? 'Simulation timed out.' : 'Could not reach backend at localhost:8000.'
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        setErrorMessage(`Backend error (${response.status}). Check Django terminal.`);
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
          properties: {
            ...cell,
            ...params,
            color,
            factors: JSON.stringify([
              { label: 'Peak Hour Factor', value: params.hour_of_day >= 8 && params.hour_of_day <= 11 ? 38 : 15 },
              { label: 'Rain Impact', value: Math.min(35, Math.round(params.rainfall_mm * 1.2)) },
              { label: 'Chokepoint Density', value: cell.is_bridge_segment ? 45 : 20 },
            ]),
          },
          geometry: { type: 'Point', coordinates: [cell.lng, cell.lat] },
        };
      });
      (map.current?.getSource('sim-grid') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features });
    } catch (err: any) {
      setErrorMessage(
        err?.name === 'AbortError' ? 'Simulation timed out.' : 'Could not reach backend at localhost:8000.'
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
    <div className="flex h-screen w-full overflow-hidden bg-slate-950">
      <Sidebar mode={mode} onModeChange={switchMode} onOpenFactoryTool={() => switchMode('pollution')} />

      <div className="relative flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopStatusBar
          mode={mode}
          isRunning={loading}
          avgCongestion={avgCongestion}
          recommendation={recommendation}
          showBuildings3D={showBuildings3D}
          onToggleBuildings={() => setShowBuildings3D(!showBuildings3D)}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
        />

        <div className="relative flex-1 w-full h-full overflow-hidden">
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

          {/* Top Controls: Search Bar & Preset Quick-Links */}
          <div className="pointer-events-none absolute left-6 top-5 z-20 flex flex-wrap items-center gap-3">
            <div className="pointer-events-auto relative">
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Prayagraj (e.g. Civil Lines)..."
                    className="h-9 w-64 rounded-xl bg-white/95 pl-8 pr-8 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-lg backdrop-blur-md border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <span className="absolute left-2.5 text-slate-400 text-xs">🔍</span>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </form>

              {searchResults.length > 0 && (
                <div className="absolute left-0 top-11 w-80 rounded-xl bg-white/98 p-1.5 shadow-2xl backdrop-blur-md border border-slate-200/90 flex flex-col gap-1 z-30">
                  {searchResults.map((res, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectLocation(res.lat, res.lng, res.name)}
                      className="flex flex-col items-start px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-50 transition text-slate-800"
                    >
                      <span className="font-semibold text-xs text-blue-600 line-clamp-1">{res.name.split(',')[0]}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{res.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleTrackCurrentPosition}
              disabled={isLiveTracking}
              className="pointer-events-auto flex items-center gap-1.5 h-9 rounded-xl bg-white/95 px-3 shadow-lg backdrop-blur-md border border-slate-200/90 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${isLiveTracking ? 'bg-amber-500 animate-spin' : 'bg-blue-600 animate-pulse'}`} />
              <span>{isLiveTracking ? 'Locating...' : 'My Location'}</span>
            </button>

            <div className="pointer-events-auto flex items-center gap-1 rounded-xl bg-white/95 px-3 py-1 shadow-lg backdrop-blur-md border border-slate-200/90">
              <span className="mr-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Street-Level:</span>
              <div className="flex gap-1">
                {CAMERA_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleCameraFlyTo(preset)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      activeCameraView === preset.label
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Floating Scenario Form */}
          <div className="pointer-events-none absolute left-6 top-20 z-10">
            <div className="pointer-events-auto">
              {mode === 'pollution' ? (
                <SimulationForm onRun={runPollutionSimulation} loading={loading} />
              ) : (
                <TrafficSimulationForm onRun={runTrafficSimulation} loading={loading} />
              )}
            </div>
          </div>

          {/* Floating Inspector Panel */}
          {inspector && (
            <div className="pointer-events-none absolute right-6 top-5 z-10">
              <div className="pointer-events-auto">
                <InspectorPanel {...inspector} onClose={() => setInspector(null)} />
              </div>
            </div>
          )}

          {/* Real-time Dynamic Active Focus Badge */}
          <div className="pointer-events-none absolute bottom-6 left-6 z-10">
            <div className="pointer-events-auto flex flex-col gap-1.5 rounded-xl bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md border border-slate-200/90 text-xs min-w-[220px]">
              <div className="flex items-center justify-between gap-4">
                <span className="font-bold tracking-wider text-slate-500 uppercase text-[10px]">Active Focus</span>
                <span className="flex items-center gap-1.5 font-bold text-blue-600 text-[11px] truncate max-w-[140px]">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0"></span>
                  {currentLocationName}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Mesh Grid</span>
                <span className="font-semibold text-slate-900">{showGrid ? '250m Active' : 'Hidden'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>3D Buildings</span>
                <span className={`font-semibold ${showBuildings3D ? 'text-blue-600' : 'text-slate-400'}`}>
                  {showBuildings3D ? 'Extruded' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 border-t border-slate-200/60 pt-1 mt-0.5 text-[11px]">
                <span className="text-slate-400">Coordinates</span>
                <span className="font-mono text-slate-800">
                  {currentCoords[1].toFixed(4)}°N, {currentCoords[0].toFixed(4)}°E
                </span>
              </div>
            </div>
          </div>

          {/* Error Notification Toast */}
          {errorMessage && (
            <div className="absolute top-5 right-6 max-w-sm bg-red-500/95 text-white text-xs font-medium rounded-xl shadow-2xl backdrop-blur-md px-4 py-3 z-50 flex items-start gap-3 border border-red-400">
              <span className="flex-1 leading-relaxed">{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-white/80 hover:text-white font-bold text-base leading-none"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}