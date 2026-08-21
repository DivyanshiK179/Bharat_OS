'use client';

export type DashboardMode = 'traffic' | 'pollution';

interface SidebarProps {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  onOpenFactoryTool?: () => void;
}

export default function Sidebar({ mode, onModeChange, onOpenFactoryTool }: SidebarProps) {
  return (
    <aside className="flex flex-col w-64 h-full bg-white border-r border-slate-200 z-20 select-none shadow-sm">
      {/* 1. Brand Logo & Product Info */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20 text-white font-bold text-lg">
          🛡️
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tight text-slate-900">BharatOS</span>
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-mono font-bold text-blue-600 border border-blue-200/50">
              v1.0
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Prayagraj Digital Twin</span>
        </div>
      </div>

      {/* 2. Navigation Modules */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* Core Simulation Tools */}
        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Simulations & Engine
          </span>
          <nav className="mt-2 space-y-1">
            {/* Traffic Simulation Link */}
            <button
              onClick={() => onModeChange('traffic')}
              className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                mode === 'traffic'
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200/60'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">🚦</span>
                <span>Traffic Simulation</span>
              </div>
              {mode === 'traffic' && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
              )}
            </button>

            {/* Pollution / Plume Dispersion Link */}
            <button
              onClick={() => onModeChange('pollution')}
              className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                mode === 'pollution'
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200/60'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">💨</span>
                <span>Pollution Simulation</span>
              </div>
              {mode === 'pollution' && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
              )}
            </button>

            {/* Factory Impact Tool */}
            <button
              onClick={() => {
                if (onOpenFactoryTool) onOpenFactoryTool();
                else onModeChange('pollution');
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <span className="text-sm">🏭</span>
              <span>Factory Impact Tool</span>
            </button>
          </nav>
        </div>

        {/* Analytics & AI Insights */}
        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Decision Support & AI
          </span>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <span className="text-sm opacity-60">📊</span>
                <span>Analytics & Reports</span>
              </div>
              <span className="text-[9px] font-mono uppercase bg-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                Soon
              </span>
            </div>

            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <span className="text-sm opacity-60">🤖</span>
                <span>Gemini Decision AI</span>
              </div>
              <span className="text-[9px] font-mono uppercase bg-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                v2.0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SIH Production Footer Status */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <div className="rounded-xl border border-slate-200/70 bg-white p-3 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Stack Status</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ONLINE
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>Backend Engine</span>
            <span className="font-mono text-slate-900 font-bold">Django REST</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>Spatial Mesh</span>
            <span className="font-mono text-blue-600 font-bold">300m Cells</span>
          </div>
        </div>
      </div>
    </aside>
  );
}