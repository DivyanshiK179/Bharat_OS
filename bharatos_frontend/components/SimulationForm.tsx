'use client';

import { useState } from 'react';

export interface SimulationParams {
  industry_type: string;
  scale: string;
  latitude: number;
  longitude: number;
  stack_height_m: number;
  wind_speed: number;
  wind_direction_deg: number;
}

interface SimulationFormProps {
  onRun: (params: SimulationParams) => void;
  loading: boolean;
}

export default function SimulationForm({ onRun, loading }: SimulationFormProps) {
  const [industryType, setIndustryType] = useState('textile');
  const [scale, setScale] = useState('medium');
  const [stackHeight, setStackHeight] = useState(20);
  const [windSpeed, setWindSpeed] = useState(3.5);
  const [windDirection, setWindDirection] = useState(270);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onRun({
      industry_type: industryType,
      scale,
      latitude: 25.4012,
      longitude: 81.8603,
      stack_height_m: stackHeight,
      wind_speed: windSpeed,
      wind_direction_deg: windDirection,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 1000,
        background: 'white',
        padding: 16,
        borderRadius: 8,
        width: 260,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontSize: 14,
      }}
    >
      <strong style={{ fontSize: 15 }}>Factory Impact Simulator</strong>

      <label>
        Industry type
        <select
          value={industryType}
          onChange={(e) => setIndustryType(e.target.value)}
          style={{ width: '100%', padding: 6, marginTop: 4 }}
        >
          <option value="textile">Textile</option>
          <option value="chemical">Chemical</option>
          <option value="cement">Cement</option>
          <option value="food_processing">Food processing</option>
        </select>
      </label>

      <label>
        Scale
        <select
          value={scale}
          onChange={(e) => setScale(e.target.value)}
          style={{ width: '100%', padding: 6, marginTop: 4 }}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </label>

      <label>
        Stack height (m)
        <input
          type="number"
          value={stackHeight}
          onChange={(e) => setStackHeight(Number(e.target.value))}
          min={1}
          max={200}
          style={{ width: '100%', padding: 6, marginTop: 4 }}
        />
      </label>

      <label>
        Wind speed (m/s)
        <input
          type="number"
          value={windSpeed}
          onChange={(e) => setWindSpeed(Number(e.target.value))}
          min={0.5}
          max={20}
          step={0.1}
          style={{ width: '100%', padding: 6, marginTop: 4 }}
        />
      </label>

      <label>
        Wind direction (° from)
        <input
          type="number"
          value={windDirection}
          onChange={(e) => setWindDirection(Number(e.target.value))}
          min={0}
          max={360}
          style={{ width: '100%', padding: 6, marginTop: 4 }}
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '8px 16px',
          background: loading ? '#93c5fd' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: 4,
        }}
      >
        {loading ? 'Running…' : 'Run simulation'}
      </button>
    </form>
  );
}