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
  showAnalytics?: boolean;
  onToggleAnalytics?: () => void;
  showTelemetry?: boolean;
  onToggleTelemetry?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export default function TopStatusBar({
  mode,
  isRunning = false,
  showBuildings3D = true,
  onToggleBuildings,
  showGrid = true,
  onToggleGrid,
  showAnalytics = true,
  onToggleAnalytics,
  showTelemetry = true,
  onToggleTelemetry,
  isDark = false,
  onToggleTheme,
}: TopStatusBarProps) {
  return (
    <header className="h-14 w-full bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-6 flex items-center justify-between select-none transition-colors duration-200 shrink-0">
      {/* Mode Title */}
      <div className="flex items-center gap-2.5">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isRunning ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
          }`}
        />
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
          {mode === 'pollution' ? 'Factory Plume & Air Simulation' : 'Traffic Congestion Analytics'}
        </h2>
      </div>

      {/* Action Toggles */}
      <div className="flex items-center gap-2">
        {onToggleAnalytics && (
          <button
            onClick={onToggleAnalytics}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition-all ${
              showAnalytics
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
            title="Toggle Right Analytics"
          >
            <span>📊</span>
            <span>Analytics</span>
          </button>
        )}

        {onToggleTelemetry && (
          <button
            onClick={onToggleTelemetry}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition-all ${
              showTelemetry
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
            title="Toggle Bottom Ticker"
          >
            <span>📡</span>
            <span>Telemetry</span>
          </button>
        )}

        {onToggleBuildings && (
          <button
            onClick={onToggleBuildings}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition-all ${
              showBuildings3D
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
          >
            <span>🏢</span>
            <span>3D</span>
          </button>
        )}

        {onToggleGrid && (
          <button
            onClick={onToggleGrid}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition-all ${
              showGrid
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
          >
            <span>🌐</span>
            <span>250m</span>
          </button>
        )}

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            title="Toggle Theme"
          >
            <span>{isDark ? '☀️' : '🌙'}</span>
          </button>
        )}

        <div className="h-8 w-8 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs flex items-center justify-center shadow-sm ml-1">
          N
        </div>
      </div>
    </header>
  );
}