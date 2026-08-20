"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api, Challenge } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { challengeGroups } from "@/lib/curriculum";
import { getProgress, type ProgressRow } from "@/lib/progress";

export default function LearnPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <LearnContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function LearnContent() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.challenges(), getProgress(user)])
      .then(([challengeData, progressData]) => {
        setChallenges(challengeData);
        setProgress(progressData);
        setError(null);
      })
      .catch((caught) => {
        const message = caught instanceof Error ? caught.message : "Learning data could not be loaded.";
        setError(message);
      });
  }, [user]);

  const completedIds = useMemo(() => new Set(progress.filter((row) => row.status === "completed").map((row) => row.challenge_id)), [progress]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <p className="font-mono text-sm text-cyan">SQLBank curriculum</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">Learn SQL by solving realistic tasks.</h1>
      {error && (
        <div className="mt-6 rounded border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-100">
          Learning data could not be loaded. {error}
        </div>
      )}
      <div className="mt-8 space-y-6">
        {challengeGroups.map((group) => (
          <section className="rounded border border-line bg-panel p-5" key={group.title}>
            <h2 className="text-lg font-semibold text-white">{group.title}</h2>
            <div className="mt-4 divide-y divide-line">
              {group.ids.map((id) => {
                const challenge = challenges.find((candidate) => candidate.id === id);
                if (!challenge) return null;
                const completed = completedIds.has(id);
                return (
                  <Link className="flex items-center justify-between gap-4 py-4 hover:text-white" href={`/challenge/${id}`} key={id}>
                    <div className="flex items-center gap-3">
                      {completed ? <CheckCircle2 className="text-success" size={18} /> : <Circle className="text-slate-600" size={18} />}
                      <div>
                        <p className="font-medium text-white">{id}. {challenge.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{challenge.difficulty} • {challenge.topic}</p>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{challenge.concept}</p>
                      </div>
                    </div>
                    <span className={completed ? "text-success" : "text-slate-500"}>{completed ? "Completed" : "Open"}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
