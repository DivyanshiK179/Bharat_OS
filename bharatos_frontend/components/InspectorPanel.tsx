'use client';

interface FactorBar {
  label: string;
  value: number; // 0-100, illustrative relative contribution
}

interface InspectorPanelProps {
  cellId: string;
  title: string;
  riskLevel: 'low' | 'moderate' | 'high';
  stats: { label: string; value: string }[];
  factors: FactorBar[];
  barColorClass: string; // e.g. 'bg-blue-500' or 'bg-amber-500'
  onClose: () => void;
}

const riskStyles = {
  low: {
    badge: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
    dot: 'bg-emerald-500',
    label: 'LOW RISK',
  },
  moderate: {
    badge: 'bg-amber-50 text-amber-600 border-amber-200/60',
    dot: 'bg-amber-500',
    label: 'MODERATE RISK',
  },
  high: {
    badge: 'bg-red-50 text-red-600 border-red-200/60',
    dot: 'bg-red-500',
    label: 'HIGH RISK',
  },
};

export default function InspectorPanel({
  cellId,
  title,
  riskLevel = 'moderate',
  stats = [],
  factors = [],
  barColorClass = 'bg-blue-600',
  onClose,
}: InspectorPanelProps) {
  const currentRisk = riskStyles[riskLevel] || riskStyles.moderate;

  return (
    <div className="w-84 rounded-2xl bg-white/95 p-5 shadow-2xl backdrop-blur-xl border border-slate-200/90 text-slate-800 space-y-4 select-none animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <span className="font-mono text-xs font-semibold text-slate-400">
          {cellId}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${currentRisk.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${currentRisk.dot}`}></span>
            {currentRisk.label}
          </span>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 leading-snug">{title}</h3>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((s, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-slate-50/80 p-2.5 border border-slate-100"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {s.label}
            </p>
            <p className="mt-0.5 font-mono text-sm font-extrabold text-slate-900">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Model Factors / SHAP Attribution */}
      {factors && factors.length > 0 && (
        <div className="space-y-3 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Model Factors (SHAP Attribution)
            </span>
          </div>

          <div className="space-y-2.5">
            {factors.map((f, idx) => {
              const clampedVal = Math.min(100, Math.max(0, f.value));
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 truncate pr-2">{f.label}</span>
                    <span className="font-mono font-bold text-red-600">
                      +{clampedVal}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        barColorClass || 'bg-amber-500'
                      }`}
                      style={{ width: `${clampedVal}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attribution Footer */}
      <div className="border-t border-slate-100 pt-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
        <span>INFERENCE: RF_V2</span>
        <span className="text-emerald-600 font-bold">● CONFIDENCE 94.2%</span>
      </div>
    </div>
  );
}