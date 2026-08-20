'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ThreeMarkerLayer from './ThreeMarkerLayer';
import SimulationForm, { SimulationParams } from './SimulationForm';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function CityMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const gridLayer = useRef<L.LayerGroup | null>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = L.map(mapContainer.current).setView([25.4012, 81.8603], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);

    gridLayer.current = L.layerGroup().addTo(map.current);
    setMapReady(true);
  }, []);

  async function runSimulation(params: SimulationParams) {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/pollution/factory-impact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Simulation failed:', errText);
        setLoading(false);
        return;
      }

      const result = await response.json();
      setRecommendation(result.recommendation);

      gridLayer.current?.clearLayers();
      result.projected_grid.forEach((cell: any) => {
        const color =
          cell.concentration > 150 ? '#ef4444' : cell.concentration > 60 ? '#f59e0b' : '#22c55e';

        L.circleMarker([cell.lat, cell.lng], {
          radius: 6,
          fillColor: color,
          color: color,
          fillOpacity: 0.6,
          weight: 0,
        }).addTo(gridLayer.current as L.LayerGroup);
      });
    } catch (err) {
      console.error('Network error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      <SimulationForm onRun={runSimulation} loading={loading} />

      {mapReady && <ThreeMarkerLayer map={map.current} lat={25.4012} lng={81.8603} />}

      {recommendation && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 1000,
            background: 'white',
            padding: 12,
            borderRadius: 8,
            maxWidth: 320,
          }}
        >
          <strong>{recommendation.decision.replace(/_/g, ' ').toUpperCase()}</strong>
          <p style={{ margin: '4px 0 0' }}>{recommendation.reason}</p>
        </div>
      )}
    </div>
  );
}