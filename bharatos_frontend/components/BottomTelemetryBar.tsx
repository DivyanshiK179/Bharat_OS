'use client';

import { DashboardMode } from './Sidebar';

interface BottomTelemetryBarProps {
  mode?: DashboardMode;
}

export default function BottomTelemetryBar({ mode = 'traffic' }: BottomTelemetryBarProps) {
  const trafficCards = [
    { icon: '🌧️', title: 'WEATHER', value: 'Clear Sky 32°C' },
    { icon: '💧', title: 'FORECAST', value: 'No Rain (0mm)' },
    { icon: '🌊', title: 'GANGA LEVEL', value: 'Normal (2.34m)' },
    { icon: '🛡️', title: 'SYSTEM', value: 'Operational', subColor: 'text-emerald-600 dark:text-emerald-400' },
    { icon: '🔔', title: 'ALERTS', value: 'No Active Alerts', subColor: 'text-emerald-600 dark:text-emerald-400' },
    { icon: '📊', title: 'INSIGHT', value: 'Traffic Normal on Bridge' },
  ];

  const pollutionCards = [
    { icon: '🌤️', title: 'WEATHER CONDITION', value: 'Clear Sky 32°C' },
    { icon: '💧', title: "TODAY'S FORECAST", value: 'No Rain (0mm)' },
    { icon: '☀️', title: 'AIR QUALITY INDEX', value: '78 (Moderate)', subColor: 'text-amber-500' },
    { icon: '🏭', title: 'POLLUTION SOURCE', value: 'Textile Industry (Active)' },
    { icon: '💨', title: 'PLUME DISPERSION', value: 'South-West Direction' },
    { icon: '📊', title: 'INSIGHT', value: 'Air quality within safe limits', subColor: 'text-emerald-600 dark:text-emerald-400' },
  ];

  const cards = mode === 'pollution' ? pollutionCards : trafficCards;

  return (
    <footer className="h-12 w-full bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 px-6 py-1.5 flex items-center justify-between gap-2.5 select-none shrink-0 transition-colors duration-200">
      {cards.map((c, i) => (
        <div
          key={i}
          className="flex-1 h-full flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
        >
          <span className="text-xs">{c.icon}</span>
          <div className="flex flex-col min-w-0 leading-none">
            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 truncate">
              {c.title}
            </span>
            <span className={`text-[10px] font-bold mt-0.5 truncate ${c.subColor || 'text-slate-800 dark:text-slate-100'}`}>
              {c.value}
            </span>
          </div>
        </div>
      ))}
    </footer>
  );
}