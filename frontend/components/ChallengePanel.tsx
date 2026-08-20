import type { Challenge } from "@/lib/api";

export function ChallengePanel({ challenge, current, total }: { challenge: Challenge; current: number; total: number }) {
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
      <p className="max-w-4xl text-sm leading-6 text-slate-300">{challenge.description}</p>
    </section>
  );
}
