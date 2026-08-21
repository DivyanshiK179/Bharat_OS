'use client';

interface RightPollutionAnalyticsProps {
  aqi?: number;
  industryType?: string;
  windSpeed?: number;
  windDirection?: number;
}

export default function RightPollutionAnalytics({
  aqi = 78,
  industryType = 'Textile',
  windSpeed = 3.5,
  windDirection = 270,
}: RightPollutionAnalyticsProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const aqiPct = Math.min((aqi / 300) * 100, 100);
  const strokeDashoffset = circumference - (aqiPct / 100) * circumference;

  const pollutants = [
    { name: 'PM2.5', value: 48, pct: 48, color: 'bg-emerald-500' },
    { name: 'PM10', value: 82, pct: 82, color: 'bg-amber-500' },
    { name: 'SO₂', value: 16, pct: 20, color: 'bg-emerald-500' },
    { name: 'NO₂', value: 26, pct: 35, color: 'bg-emerald-500' },
    { name: 'CO', value: 0.8, pct: 15, color: 'bg-emerald-500' },
    { name: 'O₃', value: 32, pct: 40, color: 'bg-emerald-500' },
  ];

  return (
    <aside className="w-72 h-full flex flex-col gap-2.5 bg-transparent select-none overflow-y-auto pr-0.5">
      {/* 1. Air Quality Overview Gauge */}
      <div className="rounded-xl bg-white dark:bg-slate-900 p-3 shadow-xs border border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-2 uppercase">
          Air Quality Overview
        </h4>
        <div className="flex items-center justify-between">
          <div className="relative flex items-center justify-center w-22 h-22">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#334155" strokeOpacity="0.2" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="url(#aqiGradient)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="aqiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="35%" stopColor="#f59e0b" />
                  <stop offset="70%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{aqi}</span>
              <span className="text-[8px] font-bold text-slate-400 mt-0.5">AQI</span>
              <span className="text-[8px] font-semibold text-amber-500">Moderate</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-[9px] font-semibold text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />0 - 50</span>
              <span className="font-medium text-slate-400">Good</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />51 - 100</span>
              <span className="font-medium text-slate-400">Moderate</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" />101 - 150</span>
              <span className="font-medium text-slate-400">Unhealthy</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />151 - 200</span>
              <span className="font-medium text-slate-400">Poor</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-purple-600" />201+</span>
              <span className="font-medium text-slate-400">Severe</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pollutant Concentration Breakdown */}
      <div className="rounded-xl bg-white dark:bg-slate-900 p-3 shadow-xs border border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-2 uppercase">
          Pollutant Concentration <span className="text-[9px] lowercase font-normal text-slate-400">(µg/m³)</span>
        </h4>
        <div className="space-y-1.5">
          {pollutants.map((p) => (
            <div key={p.name} className="space-y-0.5">
              <div className="flex justify-between text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                <span>{p.name}</span>
                <span className="font-mono text-slate-900 dark:text-white font-bold">{p.value}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Pollution Plume Intensity Gauge */}
      <div className="rounded-xl bg-white dark:bg-slate-900 p-3 shadow-xs border border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1.5 uppercase">
          Pollution Plume Intensity
        </h4>
        <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 mt-1" />
        <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-1 uppercase">
          <span>Low</span>
          <span>Moderate</span>
          <span>High</span>
          <span>Severe</span>
        </div>
        <div className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
          Current Intensity: <span className="font-bold text-amber-500">Moderate ({industryType})</span>
        </div>
      </div>

      {/* 4. Wind & Dispersion Conditions */}
      <div className="rounded-xl bg-white dark:bg-slate-900 p-3 shadow-xs border border-slate-200/80 dark:border-slate-800 flex-1 flex flex-col justify-between transition-colors duration-200">
        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1 uppercase">
          Wind & Weather Conditions
        </h4>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span>🌬️</span>
            <div>
              <span className="text-[8px] text-slate-400 block font-bold">WIND SPEED</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{windSpeed} m/s</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span>🧭</span>
            <div>
              <span className="text-[8px] text-slate-400 block font-bold">DIRECTION</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{windDirection}°</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span>🌡️</span>
            <div>
              <span className="text-[8px] text-slate-400 block font-bold">TEMP</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">32°C</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span>💧</span>
            <div>
              <span className="text-[8px] text-slate-400 block font-bold">HUMIDITY</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">38%</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}