'use client';

import { useState } from 'react';

export interface TrafficParams {
  scenario_type: string;
  hour_of_day: number;
  day_of_week: number;
  rainfall_mm: number;
  visibility_m: number;
}

interface TrafficSimulationFormProps {
  onRun: (params: TrafficParams) => void;
  loading: boolean;
}

const SCENARIOS = [
  { value: 'normal', label: 'Normal day' },
  { value: 'vip_movement', label: 'VIP movement' },
  { value: 'heavy_rain', label: 'Heavy rain' },
  { value: 'bridge_closure', label: 'Bridge maintenance' },
  { value: 'festival_crowd', label: 'Festival / Mela rush' },
];

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function TrafficSimulationForm({ onRun, loading }: TrafficSimulationFormProps) {
  const [scenarioType, setScenarioType] = useState('normal');
  const [hourOfDay, setHourOfDay] = useState(9);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [rainfallMm, setRainfallMm] = useState(0);
  const [visibilityM, setVisibilityM] = useState(10000);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onRun({
      scenario_type: scenarioType,
      hour_of_day: hourOfDay,
      day_of_week: dayOfWeek,
      rainfall_mm: rainfallMm,
      visibility_m: visibilityM,
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
          <span className="text-xs">🚦</span>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Scenario Setup
          </h3>
        </div>
        <span className="rounded-md bg-blue-50 dark:bg-blue-950/70 px-1.5 py-0.5 text-[8px] font-mono font-bold text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800">
          TRAFFIC-SIM
        </span>
      </div>

      {/* Scenario Profile */}
      <div>
        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5">
          Scenario
        </label>
        <select
          value={scenarioType}
          onChange={(e) => setScenarioType(e.target.value)}
          className="w-full rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none transition-all"
        >
          {SCENARIOS.map((s) => (
            <option key={s.value} value={s.value} className="dark:bg-slate-800 dark:text-slate-200">
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Time of Day */}
      <div className="space-y-0.5">
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Hour</span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
            {hourOfDay.toString().padStart(2, '0')}:00 hrs
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={23}
          value={hourOfDay}
          onChange={(e) => setHourOfDay(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700 accent-blue-600"
        />
      </div>

      {/* Day of Week */}
      <div className="space-y-0.5">
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">Day</span>
        <div className="grid grid-cols-7 gap-0.5">
          {DAYS.map((day, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => setDayOfWeek(idx)}
              className={`rounded py-0.5 text-[9px] font-bold transition-all ${
                dayOfWeek === idx
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Rainfall */}
      <div className="space-y-0.5">
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Rainfall</span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{rainfallMm} mm</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={rainfallMm}
          onChange={(e) => setRainfallMm(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700 accent-blue-600"
        />
      </div>

      {/* Visibility */}
      <div className="space-y-0.5">
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Visibility</span>
          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{visibilityM} m</span>
        </div>
        <input
          type="range"
          min={200}
          max={10000}
          step={200}
          value={visibilityM}
          onChange={(e) => setVisibilityM(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700 accent-blue-600"
        />
      </div>

      {/* Run Predictive Simulation Button */}
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