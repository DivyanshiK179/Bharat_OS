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
  barColorClass: string; // e.g. 'bg-blue-500' or 'bg-amber-500' — must be a static Tailwind class
  onClose: () => void;
}

const riskStyles = {
  low: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

export default function InspectorPanel({ cellId, title, riskLevel, stats, factors, barColorClass, onClose }: InspectorPanelProps) {
  return (
    <div className="absolute top-4 right-4 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[1100]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-[11px] font-mono text-slate-400">{cellId}</span>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase ${riskStyles[riskLevel]}`}>
            {riskLevel} risk
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm leading-none">✕</button>
        </div>
      </div>

      <div className="px-4 pt-3 pb-1">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 py-3">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className="text-sm font-semibold text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-slate-100">
        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">Contributing factors (est.)</p>
        <div className="space-y-2">
          {factors.map((f) => (
            <div key={f.label}>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span className="capitalize">{f.label}</span>
                <span className="font-mono">+{f.value}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${barColorClass} rounded-full`} style={{ width: `${Math.min(100, f.value)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-3 leading-snug">
          Estimated from scenario inputs — for true model-based attribution, add the <code>shap</code> library to the training pipeline.
        </p>
      </div>
    </div>
  );
}