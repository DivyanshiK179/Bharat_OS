'use client';

import { Activity, Wind, Factory, BarChart3 } from 'lucide-react';

export type DashboardMode = 'traffic' | 'pollution';

interface SidebarProps {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  onOpenFactoryTool: () => void;
}

export default function Sidebar({ mode, onModeChange, onOpenFactoryTool }: SidebarProps) {
  return (
    <aside className="w-64 h-full bg-[#0B1220] text-slate-300 flex flex-col shrink-0">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            mode === 'traffic' ? 'bg-blue-500' : 'bg-amber-500'
          }`}
        >
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white tracking-tight">BharatOS</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-400">v1.0</span>
          </div>
          <p className="text-xs text-slate-500 -mt-0.5">Prayagraj Digital Twin</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-2 text-[11px] font-mono uppercase tracking-wider text-slate-600 mb-2">Simulations</p>

        <button
          onClick={() => onModeChange('traffic')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors border-l-2 ${
            mode === 'traffic'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500'
              : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Traffic Simulation
          {mode === 'traffic' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
        </button>

        <button
          onClick={() => onModeChange('pollution')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors border-l-2 ${
            mode === 'pollution'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500'
              : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'
          }`}
        >
          <Wind className="w-4 h-4" />
          Pollution Simulation
          {mode === 'pollution' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />}
        </button>

        <button
          onClick={onOpenFactoryTool}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 border-l-2 border-transparent hover:bg-white/5 hover:text-slate-200 transition-colors"
        >
          <Factory className="w-4 h-4" />
          Factory Impact Tool
        </button>

        <p className="px-2 text-[11px] font-mono uppercase tracking-wider text-slate-600 mt-5 mb-2">Insights</p>

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 border-l-2 border-transparent cursor-not-allowed">
          <BarChart3 className="w-4 h-4" />
          Analytics &amp; Reports
          <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-600">soon</span>
        </button>
      </nav>

      <div className="px-5 py-4 border-t border-white/5 text-[11px] font-mono text-slate-600 space-y-1">
        <div className="flex justify-between"><span>BACKEND</span><span className="text-emerald-400">DJANGO · MONGO</span></div>
        <div className="flex justify-between"><span>GRID</span><span className="text-slate-400">300m cells</span></div>
      </div>
    </aside>
  );
}