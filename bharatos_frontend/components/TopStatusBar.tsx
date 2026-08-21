'use client';

import { DashboardMode } from './Sidebar';

interface TopStatusBarProps {
  mode: DashboardMode;
  isRunning?: boolean;
  avgCongestion?: number | null;
  recommendation?: { decision: string; reason: string } | null;
  showBuildings3D?: boolean;
  onToggleBuildings?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
}

export default function TopStatusBar({
  mode,
  isRunning = false,
  avgCongestion = null,
  recommendation = null,
  showBuildings3D = true,
  onToggleBuildings,
  showGrid = true,
  onToggleGrid,
}: TopStatusBarProps) {
  return (
    <header className="h-14 w-full bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 select-none shadow-sm">
      {/* Left: Active Mode & Status Indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isRunning ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
            }`}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {mode === 'pollution' ? 'Factory Plume & Air Simulation' : 'Traffic Congestion Analytics'}
          </span>
        </div>

        {recommendation && (
          <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="text-[10px] uppercase font-bold text-slate-400">Recommendation</span>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-extrabold uppercase ${
                recommendation.decision.toLowerCase() === 'approve'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              {recommendation.decision}
            </span>
          </div>
        )}

        {avgCongestion !== null && (
          <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="text-[10px] uppercase font-bold text-slate-400">Avg Congestion</span>
            <span className="text-xs font-mono font-bold text-blue-600">
              {avgCongestion}%
            </span>
          </div>
        )}
      </div>

      {/* Right: Layer Toggles (3D Buildings & Mesh Grid) */}
      <div className="flex items-center gap-2.5">
        {onToggleBuildings && (
          <button
            onClick={onToggleBuildings}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all ${
              showBuildings3D
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <span>🏢</span>
            <span>3D Buildings</span>
          </button>
        )}

        {onToggleGrid && (
          <button
            onClick={onToggleGrid}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all ${
              showGrid
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <span>🌐</span>
            <span>250m Grid</span>
          </button>
        )}
      </div>
    </header>
  );
}