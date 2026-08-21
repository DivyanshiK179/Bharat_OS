'use client';

import { useState } from 'react';

export interface TrafficParams {
  scenario_type: string;
  center_lat: number;
  center_lng: number;
  hour_of_day: number;
  day_of_week: number;
  rainfall_mm: number;
  visibility_m: number;
}

interface TrafficSimulationFormProps {
  onRun: (params: TrafficParams) => void;
  loading: boolean;
}

export default function TrafficSimulationForm({ onRun, loading }: TrafficSimulationFormProps) {
  const [scenarioType, setScenarioType] = useState('none');
  const [hourOfDay, setHourOfDay] = useState(9);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [rainfall, setRainfall] = useState(0);
  const [visibility, setVisibility] = useState(10000);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onRun({ scenario_type: scenarioType, center_lat: 25.4012, center_lng: 81.8603, hour_of_day: hourOfDay, day_of_week: dayOfWeek, rainfall_mm: rainfall, visibility_m: visibility });
  }

  return (
    <form onSubmit={handleSubmit} className="absolute top-4 left-4 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-[1000] space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Scenario Setup</h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700">TRAFFIC-SIM</span>
      </div>

      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500">
        Scenario
        <select value={scenarioType} onChange={(e) => setScenarioType(e.target.value)} className="w-full mt-1 px-2 py-1.5 rounded-md border border-slate-200 text-sm text-slate-800 font-sans normal-case">
          <option value="none">Normal day</option>
          <option value="rally">Rally / public event</option>
          <option value="protest">Protest / dharna</option>
          <option value="vip_movement">VIP movement</option>
          <option value="wedding_season">Wedding procession</option>
          <option value="mela_bathing_day">Kumbh/Magh Mela bathing day</option>
          <option value="exam_season">Exam / admission season</option>
          <option value="market_day">Weekly market day</option>
          <option value="railway_crossing_closure">Railway crossing closure</option>
        </select>
      </label>

      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500">
        Hour of day
        <input type="number" value={hourOfDay} min={0} max={23} onChange={(e) => setHourOfDay(Number(e.target.value))} className="w-full mt-1 px-2 py-1.5 rounded-md border border-slate-200 text-sm text-slate-800 font-sans" />
      </label>

      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500">
        Day of week (0=Mon, 6=Sun)
        <input type="number" value={dayOfWeek} min={0} max={6} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="w-full mt-1 px-2 py-1.5 rounded-md border border-slate-200 text-sm text-slate-800 font-sans" />
      </label>

      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500">
        Rainfall (mm)
        <input type="number" value={rainfall} min={0} max={100} step={0.5} onChange={(e) => setRainfall(Number(e.target.value))} className="w-full mt-1 px-2 py-1.5 rounded-md border border-slate-200 text-sm text-slate-800 font-sans" />
      </label>

      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500">
        Visibility (m)
        <input type="number" value={visibility} min={100} max={10000} step={100} onChange={(e) => setVisibility(Number(e.target.value))} className="w-full mt-1 px-2 py-1.5 rounded-md border border-slate-200 text-sm text-slate-800 font-sans" />
      </label>

      <button type="submit" disabled={loading} className={`w-full py-2 rounded-md text-sm font-medium text-white transition-colors ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}>
        {loading ? 'Running…' : 'Run Predictive Simulation'}
      </button>
    </form>
  );
}