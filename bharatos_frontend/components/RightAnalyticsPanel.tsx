'use client';

interface RightAnalyticsPanelProps {
  congestionPct?: number;
}

export default function RightAnalyticsPanel({ congestionPct = 68 }: RightAnalyticsPanelProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (congestionPct / 100) * circumference;

  const topZones = [
    { name: 'Civil Lines (MG Marg)', pct: 68, color: 'bg-red-500' },
    { name: 'New Yamuna Bridge', pct: 54, color: 'bg-orange-500' },
    { name: 'Old Naini Bridge', pct: 47, color: 'bg-amber-500' },
    { name: 'Sangam Confluence', pct: 36, color: 'bg-emerald-500' },
    { name: 'Naini Industrial Hub', pct: 28, color: 'bg-emerald-500' },
  ];

  return (
    <aside className="w-72 h-full flex flex-col gap-2.5 bg-transparent select-none overflow-y-auto pr-0.5">
      {/* 1. Live Traffic Congestion */}
      <div className="rounded-xl bg-white dark:bg-slate-900 p-3 shadow-xs border border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-2 uppercase">
          Live Traffic Congestion
        </h4>
        <div className="flex items-center justify-between">
          <div className="relative flex items-center justify-center w-22 h-22">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#334155"
                strokeOpacity="0.2"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="url(#congestGrad)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="congestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="45%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                {congestionPct}%
              </span>
              <span className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase">Congestion</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-[9px] font-semibold text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between gap-2.5">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Low</span>
              <span className="font-mono text-slate-400 font-medium">18%</span>
            </div>
            <div className="flex items-center justify-between gap-2.5">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Moderate</span>
              <span className="font-mono text-slate-400 font-medium">24%</span>
            </div>
            <div className="flex items-center justify-between gap-2.5">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" />High</span>
              <span className="font-mono text-slate-400 font-medium">38%</span>
            </div>
            <div className="flex items-center justify-between gap-2.5">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />Severe</span>
              <span className="font-mono text-slate-400 font-medium">20%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Traffic Flow Trend */}
      <div className="rounded-xl bg-white dark:bg-slate-900 p-3 shadow-xs border border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1 uppercase">
          Traffic Flow Trend
        </h4>
        <div className="relative h-20 w-full">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 240 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path
              d="M 0,68 Q 35,60 60,42 T 120,8 T 180,38 T 240,68 L 240,80 L 0,80 Z"
              fill="url(#areaTrend)"
            />
            <path
              d="M 0,68 Q 35,60 60,42 T 120,8 T 180,38 T 240,68"
              fill="none"
              stroke="#ea580c"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="flex justify-between text-[8px] font-mono text-slate-400 mt-1 px-0.5">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>

      {/* 3. Top Congested Zones */}
      <div className="rounded-xl bg-white dark:bg-slate-900 p-3 shadow-xs border border-slate-200/80 dark:border-slate-800 flex-1 flex flex-col justify-between transition-colors duration-200">
        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-2 uppercase">
          Top Congested Zones
        </h4>
        <div className="space-y-2">
          {topZones.map((z) => (
            <div key={z.name} className="space-y-0.5">
              <div className="flex justify-between text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                <span className="truncate max-w-[150px]">{z.name}</span>
                <span className="font-mono text-slate-900 dark:text-white font-bold">{z.pct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className={`h-full rounded-full ${z.color}`} style={{ width: `${z.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}