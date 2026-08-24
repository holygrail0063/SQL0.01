export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "font-semibold text-slate-950" : "text-xl font-semibold text-slate-950"}>
      QueryRight<span className="text-brand-strong">_</span>
    </span>
  );
}
