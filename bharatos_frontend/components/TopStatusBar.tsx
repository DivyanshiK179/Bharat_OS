'use client';

import { DashboardMode } from './Sidebar';

interface TopStatusBarProps {
  mode: DashboardMode;
  isRunning: boolean;
  avgCongestion: number | null;
  recommendation: any;
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-sm font-semibold font-mono ${accent ?? 'text-slate-800'}`}>{value}</p>
    </div>
  );
}

export default function TopStatusBar({ mode, isRunning, avgCongestion, recommendation }: TopStatusBarProps) {
  const accent = mode === 'traffic' ? 'text-blue-600' : 'text-amber-600';

  return (
    <div className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-8 shrink-0">
      {mode === 'traffic' ? (
        <>
          <Stat label="Avg congestion" value={avgCongestion !== null ? `${avgCongestion}%` : '—'} accent={accent} />
          <Stat label="Grid resolution" value="300m" />
          <Stat label="Model" value="XGBoost" />
        </>
      ) : (
        <>
          <Stat
            label="Recommendation"
            value={recommendation ? recommendation.decision.replace(/_/g, ' ').toUpperCase() : '—'}
            accent={accent}
          />
          <Stat label="Threshold" value="NAAQS 60 µg/m³" />
          <Stat label="Model" value="Regression + Plume" />
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
        <span className="text-xs font-mono text-slate-500">{isRunning ? 'SIMULATION RUNNING' : 'IDLE'}</span>
      </div>
    </div>
  );
}