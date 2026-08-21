'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import SimulationForm, { SimulationParams } from './SimulationForm';
import TrafficSimulationForm, { TrafficParams } from './TrafficSimulationForm';
import Sidebar, { DashboardMode } from './Sidebar';
import TopStatusBar from './TopStatusBar';
import RightAnalyticsPanel from './RightAnalyticsPanel';
import RightPollutionAnalytics from './RightPollutionAnalytics';
import BottomTelemetryBar from './BottomTelemetryBar';
import InspectorPanel from './InspectorPanel';

const CAMERA_PRESETS = [
  { label: 'New Yamuna Bridge', center: [81.8613, 25.4272] as [number, number], zoom: 17.5, pitch: 60, bearing: 30 },
  { label: 'Old Naini Bridge', center: [81.85028, 25.42389] as [number, number], zoom: 17.5, pitch: 58, bearing: -30 },
  { label: 'Sangam Confluence', center: [81.8899, 25.4242] as [number, number], zoom: 17.2, pitch: 52, bearing: 35 },
  { label: 'Civil Lines (MG Marg)', center: [81.8340, 25.4528] as [number, number], zoom: 17.4, pitch: 55, bearing: 0 },
  { label: 'Naini Industrial Hub', center: [81.8680, 25.3820] as [number, number], zoom: 17.0, pitch: 60, bearing: -15 },
  { label: 'Aerial Overview', center: [81.8550, 25.4300] as [number, number], zoom: 13.5, pitch: 0, bearing: 0 },
];

const LOCAL_GAZETTEER = [
  { name: 'Dhoomanganj, Prayagraj', lat: 25.4495, lng: 81.7783 },
  { name: 'Civil Lines (Subhash Chauraha), Prayagraj', lat: 25.4528, lng: 81.8340 },
  { name: 'Triveni Sangam Ghat, Prayagraj', lat: 25.4242, lng: 81.8899 },
  { name: 'New Yamuna Cable Bridge, Prayagraj', lat: 25.4272, lng: 81.8613 },
  { name: 'Old Naini Bridge, Prayagraj', lat: 25.42389, lng: 81.85028 },
  { name: 'Naini Industrial Area, Prayagraj', lat: 25.3820, lng: 81.8680 },
  { name: 'Katra (University Area), Prayagraj', lat: 25.4610, lng: 81.8570 },
  { name: 'Georgetown, Prayagraj', lat: 25.4450, lng: 81.8560 },
  { name: 'Daraganj Ghat, Prayagraj', lat: 25.4380, lng: 81.8790 },
  { name: 'Kydganj, Prayagraj', lat: 25.4310, lng: 81.8520 },
  { name: 'Jhalwa (IIIT-A Area), Prayagraj', lat: 25.4290, lng: 81.7710 },
  { name: 'Bamrauli Airport Area, Prayagraj', lat: 25.4410, lng: 81.7340 },
  { name: 'Phaphamau Bridge, Prayagraj', lat: 25.5010, lng: 81.8580 },
  { name: 'Allahabad Fort / Akshayavat, Prayagraj', lat: 25.4295, lng: 81.8760 },
  { name: 'High Court of Judicature, Prayagraj', lat: 25.4570, lng: 81.8230 },
];

const DEFAULT_LNG = 81.8613;
const DEFAULT_LAT = 25.4272;

function getPolygonCentroid(coordinates: number[][][]): [number, number] | null {
  const ring = coordinates?.[0];
  if (!ring || ring.length === 0) return null;
  let totalLng = 0;
  let totalLat = 0;
  for (let i = 0; i < ring.length; i++) {
    totalLng += ring[i][0];
    totalLat += ring[i][1];
  }
  return [totalLng / ring.length, totalLat / ring.length];
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
        features.push({
          type: 'Feature',
          properties: { height: 8 + Math.random() * 28 },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [baseLng, baseLat],
                [baseLng + 15 * mLng, baseLat],
                [baseLng + 15 * mLng, baseLat + 15 * mLat],
                [baseLng, baseLat + 15 * mLat],
                [baseLng, baseLat],
              ],
            ],
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
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isDark, setIsDark] = useState(false);
  const [mode, setMode] = useState<DashboardMode>('pollution');
  const modeRef = useRef<DashboardMode>('pollution');
  const [recommendation, setRecommendation] = useState<any>(null);
  const [avgCongestion, setAvgCongestion] = useState<number | null>(68);
  const [loading, setLoading] = useState(false);
  const [inspector, setInspector] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBuildings3D, setShowBuildings3D] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Dynamic Panel Visibility
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [showTelemetry, setShowTelemetry] = useState(true);

  const [activeCameraView, setActiveCameraView] = useState('New Yamuna Bridge');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocationName, setCurrentLocationName] = useState('New Yamuna Bridge');
  const [currentCoords, setCurrentCoords] = useState<[number, number]>([DEFAULT_LNG, DEFAULT_LAT]);
  const [isLiveTracking, setIsLiveTracking] = useState(false);

  const baselineById = useRef<Record<string, number>>({});

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.current?.resize();
    }, 200);
    return () => clearTimeout(timer);
  }, [showAnalytics, showTelemetry]);

  useEffect(() => {
    if (!map.current || !map.current.getLayer('buildings-3d')) return;
    map.current.setLayoutProperty('buildings-3d', 'visibility', showBuildings3D ? 'visible' : 'none');
  }, [showBuildings3D]);

  useEffect(() => {
    if (!map.current || !map.current.getLayer('sim-grid-layer')) return;
    map.current.setLayoutProperty('sim-grid-layer', 'visibility', showGrid ? 'visible' : 'none');
  }, [showGrid]);

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
        'absolute -top-9 whitespace-nowrap bg-slate-950/95 text-white font-semibold text-[11px] px-2.5 py-1 rounded-lg shadow-2xl border border-slate-700/80 pointer-events-none transition-all';
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
    if (geocodeAbortRef.current) geocodeAbortRef.current.abort();
    geocodeAbortRef.current = new AbortController();

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' }, signal: geocodeAbortRef.current.signal }
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
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            maxzoom: 19,
          },
          osmOverlay: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
          },
        },
        layers: [
          { id: 'satellite-layer', type: 'raster', source: 'satellite' },
          { id: 'osm-overlay', type: 'raster', source: 'osmOverlay', paint: { 'raster-opacity': 0.2 } },
        ],
        light: { anchor: 'viewport', color: '#ffffff', intensity: 0.65, position: [1.5, 90, 40] },
      },
      center: [DEFAULT_LNG, DEFAULT_LAT],
      zoom: 17.5,
      pitch: 60,
      bearing: 30,
      antialias: true,
    });

    map.current.on('load', () => {
      if (!map.current) return;
      updateLocationMarker([DEFAULT_LNG, DEFAULT_LAT], 'New Yamuna Bridge');

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

  const performSearch = async (queryText: string) => {
    const q = queryText.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const localMatches = LOCAL_GAZETTEER.filter((item) =>
      item.name.toLowerCase().includes(q)
    );

    if (localMatches.length > 0) {
      setSearchResults(localMatches);
      setIsSearching(false);
      return;
    }

    try {
      const searchTarget = q.includes('prayagraj') || q.includes('allahabad') ? q : `${q}, Prayagraj`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTarget)}&format=json&limit=5&addressdetails=1`
      );
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
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
    } catch {
      setSearchResults(localMatches);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (val.trim().length >= 1) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(val);
      }, 250);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    performSearch(searchQuery);
  };

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

  async function runPollutionSimulation(params: SimulationParams) {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('http://localhost:8000/api/pollution/factory-impact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        setErrorMessage(`Backend error (${response.status})`);
        return;
      }
      const result = await response.json();
      setRecommendation(result.recommendation);
      setAvgCongestion(null);
      baselineById.current = Object.fromEntries(result.baseline_grid.map((c: any) => [c.id, c.concentration]));
    } catch {
      setErrorMessage('Could not reach backend at localhost:8000.');
    } finally {
      setLoading(false);
    }
  }

  async function runTrafficSimulation(params: TrafficParams) {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('http://localhost:8000/api/traffic/predict/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        setErrorMessage(`Backend error (${response.status})`);
        return;
      }
      const result = await response.json();
      setAvgCongestion(result.avg_congestion_percent);
      setRecommendation(null);
    } catch {
      setErrorMessage('Could not reach backend at localhost:8000.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${isDark ? 'dark' : ''} flex h-screen w-screen overflow-hidden font-sans`}>
      <div className="flex h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {/* 1. Left Sidebar */}
        <Sidebar mode={mode} onModeChange={setMode} />

        {/* 2. Main Body */}
        <div className="relative flex flex-1 flex-col h-full min-w-0 overflow-hidden bg-slate-50/60 dark:bg-slate-950/60">
          {/* Top Header */}
          <TopStatusBar
            mode={mode}
            isRunning={loading}
            avgCongestion={avgCongestion}
            recommendation={recommendation}
            showBuildings3D={showBuildings3D}
            onToggleBuildings={() => setShowBuildings3D(!showBuildings3D)}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(!showGrid)}
            showAnalytics={showAnalytics}
            onToggleAnalytics={() => setShowAnalytics(!showAnalytics)}
            showTelemetry={showTelemetry}
            onToggleTelemetry={() => setShowTelemetry(!showTelemetry)}
            isDark={isDark}
            onToggleTheme={() => setIsDark(!isDark)}
          />

          {/* Unified Single-Line Control Bar */}
          <div className="px-6 py-2 flex items-center justify-between gap-3 select-none relative z-30">
            <div className="flex items-center gap-2.5 flex-nowrap shrink-0">
              {/* Search Box */}
              <div className="relative">
                <form onSubmit={handleSearchSubmit} className="flex items-center">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      placeholder="Search Prayagraj (e.g. Dhoomanganj)..."
                      className="h-8 w-56 rounded-xl bg-white dark:bg-slate-800 pl-7 pr-6 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="absolute left-2.5 text-slate-400 text-xs">🔍</span>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </form>

                {/* Dropdown Results */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 top-9 w-80 rounded-xl bg-white dark:bg-slate-800 p-1.5 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-1 z-50">
                    {searchResults.map((res, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectLocation(res.lat, res.lng, res.name)}
                        className="flex flex-col items-start px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-50 dark:hover:bg-slate-700 transition text-slate-800 dark:text-slate-200"
                      >
                        <span className="font-semibold text-xs text-blue-600 dark:text-blue-400 line-clamp-1">
                          {res.name.split(',')[0]}
                        </span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">{res.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {isSearching && (
                  <div className="absolute left-0 top-9 w-44 rounded-xl bg-white dark:bg-slate-800 p-2 shadow-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-400 flex items-center gap-2 z-50">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <span>Searching...</span>
                  </div>
                )}
              </div>

              {/* My Location GPS Button */}
              <button
                onClick={handleTrackCurrentPosition}
                disabled={isLiveTracking}
                className="flex items-center gap-1.5 h-8 rounded-xl bg-white dark:bg-slate-800 px-2.5 shadow-xs border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 transition shrink-0"
              >
                <span className={`h-2 w-2 rounded-full ${isLiveTracking ? 'bg-amber-500 animate-spin' : 'bg-blue-600 animate-pulse'}`} />
                <span>{isLiveTracking ? 'Locating...' : 'My Location'}</span>
              </button>

              <span className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5" />

              {/* Street-Level Presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                  STREET-LEVEL:
                </span>
                <div className="flex items-center gap-1.5">
                  {CAMERA_PRESETS.map((p, idx) => (
                    <div key={p.label} className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCameraFlyTo(p)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shadow-xs whitespace-nowrap ${
                          activeCameraView === p.label
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        {p.label}
                      </button>
                      {idx < CAMERA_PRESETS.length - 1 && (
                        <span className="text-slate-300 dark:text-slate-700 text-xs">›</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expansion Toggle */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition flex items-center gap-1 shrink-0 ml-2"
            >
              <span>{showAnalytics ? 'Collapse Panel' : 'Expand Analytics'}</span>
              <span>{showAnalytics ? '⇥' : '⇤'}</span>
            </button>
          </div>

          {/* Main Stage */}
          <div className="flex-1 flex px-6 pb-2.5 gap-3.5 min-h-0 relative z-10">
            {/* 3D Map Viewport */}
            <div className="relative flex-1 h-full rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 bg-slate-900 transition-all duration-300">
              <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

              {/* Floating Scenario Setup Form */}
              <div className="absolute left-4 top-4 z-20 pointer-events-auto">
                {mode === 'pollution' ? (
                  <SimulationForm onRun={runPollutionSimulation} loading={loading} />
                ) : (
                  <TrafficSimulationForm onRun={runTrafficSimulation} loading={loading} />
                )}
              </div>

              {/* Floating Map Controls Dock */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 pointer-events-auto">
                <div className="flex flex-col rounded-xl bg-white/95 dark:bg-slate-800/95 shadow-md border border-slate-200/80 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={() => map.current?.flyTo({ center: currentCoords, zoom: 18, pitch: 60 })}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                    title="Target Location"
                  >
                    🎯
                  </button>
                  <div className="h-[1px] bg-slate-200 dark:bg-slate-700" />
                  <button
                    onClick={() => map.current?.zoomIn()}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
                    title="Zoom In"
                  >
                    ＋
                  </button>
                  <div className="h-[1px] bg-slate-200 dark:bg-slate-700" />
                  <button
                    onClick={() => map.current?.zoomOut()}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
                    title="Zoom Out"
                  >
                    －
                  </button>
                </div>

                <div className="flex flex-col rounded-xl bg-white/95 dark:bg-slate-800/95 shadow-md border border-slate-200/80 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={() => setShowBuildings3D(!showBuildings3D)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                    title="Toggle Layers"
                  >
                    📚
                  </button>
                  <div className="h-[1px] bg-slate-200 dark:bg-slate-700" />
                  <button
                    onClick={() => map.current?.resetNorthPitch()}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-500 font-bold transition"
                    title="Reset Compass"
                  >
                    🧭
                  </button>
                </div>
              </div>

              {/* Inspector Panel */}
              {inspector && (
                <div className="absolute right-16 top-4 z-20 pointer-events-auto">
                  <InspectorPanel {...inspector} onClose={() => setInspector(null)} />
                </div>
              )}

              {/* Bottom-Left Focus Telemetry Chip */}
              <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 px-4 py-3 shadow-md border border-slate-200/80 dark:border-slate-800 text-xs min-w-[210px] transition-colors duration-200">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold tracking-wider text-slate-400 uppercase text-[10px]">Active Focus</span>
                  <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 text-[11px] truncate max-w-[130px]">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    {currentLocationName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>Mesh Grid</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{showGrid ? '250m Active' : 'Hidden'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>3D Buildings</span>
                  <span className={`font-semibold ${showBuildings3D ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                    {showBuildings3D ? 'Extruded' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800 pt-1 mt-0.5 text-[11px]">
                  <span className="text-slate-400">Coordinates</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {currentCoords[1].toFixed(4)}°N, {currentCoords[0].toFixed(4)}°E
                  </span>
                </div>
              </div>

              {/* Single Clean Attribution Badge */}
              <div className="absolute bottom-3 right-3 z-10 px-2 py-0.5 rounded-lg bg-white/90 dark:bg-slate-900/90 shadow-xs border border-slate-200/70 dark:border-slate-800 text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                © OpenStreetMap | Esri World Imagery | MapLibre
              </div>
            </div>

            {/* Dynamic Right Analytics Panel based on Mode */}
            {showAnalytics && (
              mode === 'pollution' ? (
                <RightPollutionAnalytics
                  aqi={78}
                  industryType="Textile"
                  windSpeed={3.5}
                  windDirection={270}
                />
              ) : (
                <RightAnalyticsPanel congestionPct={avgCongestion || 68} />
              )
            )}
          </div>

          {/* Dynamic Bottom Telemetry Bar */}
          {showTelemetry && <BottomTelemetryBar mode={mode} />}

          {/* Error Toast */}
          {errorMessage && (
            <div className="absolute top-5 right-6 max-w-sm bg-red-500 text-white text-xs font-medium rounded-xl shadow-2xl px-4 py-3 z-50 flex items-start gap-3 border border-red-400">
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