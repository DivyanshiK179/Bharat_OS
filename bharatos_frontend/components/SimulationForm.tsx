'use client';

import { useState } from 'react';

export interface SimulationParams {
  industry_type: string;
  scale: string;
  stack_height_m: number;
  wind_speed: number;
  wind_direction: number;
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
      stack_height_m: stackHeight,
      wind_speed: windSpeed,
      wind_direction: windDirection,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-64 rounded-xl bg-white/95 dark:bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-2.5 select-none transition-colors duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">💨</span>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Scenario Setup
          </h3>
        </div>
        <span className="rounded-md bg-amber-50 dark:bg-amber-950/70 px-1.5 py-0.5 text-[8px] font-mono font-bold text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800">
          SIM-POLLUTION
        </span>
      </div>

      {/* Industry Type & Scale */}
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5">
            Industry Type
          </label>
          <select
            value={industryType}
            onChange={(e) => setIndustryType(e.target.value)}
            className="w-full rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none transition-all"
          >
            <option value="textile">Textile</option>
            <option value="chemical">Chemical</option>
            <option value="brick_kiln">Brick Kiln</option>
            <option value="tannery">Tannery</option>
          </select>
        </div>

        <div>
          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5">
            Scale
          </label>
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value)}
            className="w-full rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none transition-all"
          >
            <option value="small">Small (0.5x)</option>
            <option value="medium">Medium (1.0x)</option>
            <option value="large">Large (2.0x)</option>
          </select>
        </div>
      </div>

      {/* Stack Height */}
      <div className="space-y-0.5">
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Stack Height</span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{stackHeight} m</span>
        </div>
        <input
          type="range"
          min={10}
          max={60}
          value={stackHeight}
          onChange={(e) => setStackHeight(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700 accent-blue-600"
        />
      </div>

      {/* Wind Speed */}
      <div className="space-y-0.5">
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Wind Speed</span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{windSpeed} m/s</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={15}
          step={0.5}
          value={windSpeed}
          onChange={(e) => setWindSpeed(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700 accent-blue-600"
        />
      </div>

      {/* Wind Direction */}
      <div className="space-y-0.5">
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Wind Direction (° From)</span>
          <span className="font-mono font-bold text-amber-500">{windDirection}°</span>
        </div>
        <input
          type="range"
          min={0}
          max={359}
          value={windDirection}
          onChange={(e) => setWindDirection(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700 accent-amber-500"
        />
      </div>

      {/* Run Simulation Button */}
      <button
        type="submit"
        disabled={loading}
        className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold text-white shadow-sm transition-all ${
          loading
            ? 'bg-blue-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 active:scale-[0.98]'
        }`}
      >
        {loading ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Simulating...</span>
          </>
        ) : (
          <>
            <span>⚡</span>
            <span>Run Predictive Simulation</span>
          </>
        )}
      </button>
    </form>
  );
}