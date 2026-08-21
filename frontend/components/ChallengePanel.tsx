import type { Challenge } from "@/lib/api";

export function ChallengePanel({ challenge, current, total, sqlLevel }: { challenge: Challenge; current: number; total: number; sqlLevel?: string | null }) {
  const guidance = (sqlLevel && challenge.guidance[sqlLevel]) || challenge.guidance["Completely New"];

  return (
    <section className="border-b border-line bg-panel px-6 py-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">SQLBank • Task #{String(challenge.id).padStart(3, "0")} • Progress {current} / {total}</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">{challenge.title}</h1>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded border border-line px-2 py-1 text-slate-300">{challenge.difficulty}</span>
          <span className="rounded border border-line px-2 py-1 text-mint">{challenge.topic}</span>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan">Work Request</p>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">{challenge.description}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Concept</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{challenge.concept}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">How It Works</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{challenge.lesson}</p>
          </div>
        </div>
        <div className="space-y-4 rounded border border-line bg-[#0a1322] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pattern</p>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded bg-[#070d16] p-3 font-mono text-xs leading-5 text-slate-300">{challenge.example_sql}</pre>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your Checklist</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {challenge.success_criteria.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          {guidance && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{sqlLevel ?? "Completely New"} Guidance</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{guidance}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
