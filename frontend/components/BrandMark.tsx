export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "font-semibold text-white" : "text-xl font-semibold text-white"}>
      QueryRight<span className="text-cyan">_</span>
    </span>
  );
}
