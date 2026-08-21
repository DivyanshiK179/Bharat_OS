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
    onRun({ industry_type: industryType, scale, latitude: 25.4012, longitude: 81.8603, stack_height_m: stackHeight, wind_speed: windSpeed, wind_direction_deg: windDirection });
  }

  return (
    <form onSubmit={handleSubmit} className="absolute top-4 left-4 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-[1000] space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Scenario Setup</h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700">FACTORY-SIM</span>
      </div>

      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500">
        Industry type
        <select value={industryType} onChange={(e) => setIndustryType(e.target.value)} className="w-full mt-1 px-2 py-1.5 rounded-md border border-slate-200 text-sm text-slate-800 font-sans normal-case">
          <option value="textile">Textile</option>
          <option value="chemical">Chemical</option>
          <option value="cement">Cement</option>
          <option value="food_processing">Food processing</option>
        </select>
      </label>

      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500">
        Scale
        <select value={scale} onChange={(e) => setScale(e.target.value)} className="w-full mt-1 px-2 py-1.5 rounded-md border border-slate-200 text-sm text-slate-800 font-sans normal-case">
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </label>

      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500">
        Stack height (m)
        <input type="number" value={stackHeight} min={1} max={200} onChange={(e) => setStackHeight(Number(e.target.value))} className="w-full mt-1 px-2 py-1.5 rounded-md border border-slate-200 text-sm text-slate-800 font-sans" />
      </label>

      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500">
        Wind speed (m/s)
        <input type="number" value={windSpeed} min={0.5} max={20} step={0.1} onChange={(e) => setWindSpeed(Number(e.target.value))} className="w-full mt-1 px-2 py-1.5 rounded-md border border-slate-200 text-sm text-slate-800 font-sans" />
      </label>

      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500">
        Wind direction (° from)
        <input type="number" value={windDirection} min={0} max={360} onChange={(e) => setWindDirection(Number(e.target.value))} className="w-full mt-1 px-2 py-1.5 rounded-md border border-slate-200 text-sm text-slate-800 font-sans" />
      </label>

      <button type="submit" disabled={loading} className={`w-full py-2 rounded-md text-sm font-medium text-white transition-colors ${loading ? 'bg-amber-300 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'}`}>
        {loading ? 'Running…' : 'Run Predictive Simulation'}
      </button>
    </form>
  );
}