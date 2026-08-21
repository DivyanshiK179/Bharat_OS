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
      className="w-80 rounded-2xl bg-white/95 p-5 shadow-2xl backdrop-blur-xl border border-slate-200/90 text-slate-800 space-y-4 select-none"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 font-bold text-sm">🎛️</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Scenario Setup
          </h3>
        </div>
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-blue-700 border border-blue-200/60">
          SIM-POLLUTION
        </span>
      </div>

      {/* Selects Grid: Industry & Scale */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Industry Type
          </label>
          <select
            value={industryType}
            onChange={(e) => setIndustryType(e.target.value)}
            className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
          >
            <option value="textile">Textile</option>
            <option value="chemical">Chemical</option>
            <option value="cement">Cement</option>
            <option value="food_processing">Food Processing</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Scale
          </label>
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value)}
            className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
          >
            <option value="small">Small (0.5x)</option>
            <option value="medium">Medium (1.0x)</option>
            <option value="large">Large (2.5x)</option>
          </select>
        </div>
      </div>

      {/* Stack Height Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[11px] font-semibold text-slate-600">Stack Height</span>
          <span className="font-mono text-xs font-bold text-blue-600">{stackHeight} m</span>
        </div>
        <input
          type="range"
          min={5}
          max={150}
          value={stackHeight}
          onChange={(e) => setStackHeight(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
        />
      </div>

      {/* Wind Speed Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[11px] font-semibold text-slate-600">Wind Speed</span>
          <span className="font-mono text-xs font-bold text-blue-600">{windSpeed} m/s</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={20}
          step={0.1}
          value={windSpeed}
          onChange={(e) => setWindSpeed(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
        />
      </div>

      {/* Wind Direction Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[11px] font-semibold text-slate-600">Wind Direction (° From)</span>
          <span className="font-mono text-xs font-bold text-amber-600">{windDirection}°</span>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          step={5}
          value={windDirection}
          onChange={(e) => setWindDirection(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-amber-500"
        />
      </div>

      {/* Action Button */}
      <button
        type="submit"
        disabled={loading}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white shadow-lg transition-all ${
          loading
            ? 'bg-blue-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 active:scale-[0.98]'
        }`}
      >
        {loading ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            <span>Running Simulation...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>Run Predictive Simulation</span>
          </>
        )}
      </button>
    </form>
  );
}