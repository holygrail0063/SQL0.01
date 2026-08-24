import { ChevronLeft, ChevronRight } from "lucide-react";

export function ChallengeNavigation({
  canGoPrevious,
  canGoNext,
  nextEnabled,
  onPrevious,
  onNext,
}: {
  canGoPrevious: boolean;
  canGoNext: boolean;
  nextEnabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        className="inline-flex h-9 items-center gap-1 rounded border border-line px-3 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!canGoPrevious}
        onClick={onPrevious}
        type="button"
      >
        <ChevronLeft size={16} />
        Previous
      </button>
      <button
        className="inline-flex h-9 items-center gap-1 rounded bg-brand px-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        disabled={!canGoNext || !nextEnabled}
        onClick={onNext}
        type="button"
      >
        Next Challenge
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
