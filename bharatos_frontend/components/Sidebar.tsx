'use client';

export type DashboardMode = 'traffic' | 'pollution';

interface SidebarProps {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  onOpenFactoryTool?: () => void;
}

export default function Sidebar({ mode, onModeChange, onOpenFactoryTool }: SidebarProps) {
  return (
    <aside className="flex flex-col w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/90 z-20 select-none shrink-0 transition-colors duration-200">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20 text-white font-bold text-base">
          🛡️
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">BharatOS</span>
            <span className="rounded bg-blue-50 dark:bg-blue-950/70 px-1.5 py-0.5 text-[9px] font-mono font-bold text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800">
              v1.0
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Prayagraj Digital Twin</span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Simulations & Engine
          </span>
          <nav className="mt-2 space-y-1">
            <button
              onClick={() => onModeChange('traffic')}
              className={`flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'traffic'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/80'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🚦</span>
                <span>Traffic Simulation</span>
              </div>
              {mode === 'traffic' && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
            </button>

            <button
              onClick={() => onModeChange('pollution')}
              className={`flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'pollution'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/80'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>💨</span>
                <span>Pollution Simulation</span>
              </div>
              {mode === 'pollution' && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
            </button>

            <button
              onClick={() => {
                if (onOpenFactoryTool) onOpenFactoryTool();
                else onModeChange('pollution');
              }}
              className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <span>🏭</span>
              <span>Factory Impact Tool</span>
            </button>
          </nav>
        </div>

        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Decision Support & AI
          </span>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 dark:text-slate-500 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <span>📊</span>
                <span>Analytics & Reports</span>
              </div>
              <span className="text-[9px] font-mono font-bold uppercase bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 px-1 py-0.5 rounded">
                Soon
              </span>
            </div>

            <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 dark:text-slate-500 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <span>🤖</span>
                <span>Gemini Decision AI</span>
              </div>
              <span className="text-[9px] font-mono font-bold uppercase bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 px-1 py-0.5 rounded">
                v2.0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status Panel */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/50">
        <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-2.5 space-y-1.5 transition-colors">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            <span>Stack Status</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300 font-medium">
            <span>Backend Engine</span>
            <span className="font-mono text-slate-900 dark:text-white font-bold">Django REST</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300 font-medium">
            <span>Spatial Mesh</span>
            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">300m Cells</span>
          </div>
        </div>
      </div>
    </aside>
  );
}