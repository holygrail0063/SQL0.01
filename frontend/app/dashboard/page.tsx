"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api, Challenge } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { nextUnfinishedChallenge, skillForChallenge } from "@/lib/curriculum";
import { getProfile, getProgress, type Profile, type ProgressRow } from "@/lib/progress";

function readableError(caught: unknown) {
  if (caught instanceof Error) return caught.message;
  if (typeof caught === "string") return caught;
  try {
    return JSON.stringify(caught);
  } catch {
    return "Unknown error.";
  }
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getProfile(user), getProgress(user), api.challenges()])
      .then(([profileData, progressData, challengeData]) => {
        if (!profileData?.onboarding_completed) {
          router.replace("/onboarding");
          return;
        }
        setProfile(profileData);
        setProgress(progressData);
        setChallenges(challengeData);
      })
      .catch((caught) => setError(`Dashboard data could not be loaded. ${readableError(caught)}`))
      .finally(() => setLoading(false));
  }, [router, user]);

  const completedIds = useMemo(() => new Set(progress.filter((row) => row.status === "completed").map((row) => row.challenge_id)), [progress]);
  const nextChallenge = nextUnfinishedChallenge(challenges, completedIds);
  const completedCount = completedIds.size;

  if (loading) return <main className="p-8 text-slate-400">Loading dashboard...</main>;
  if (error) return <main className="p-8 text-red-200">{error}</main>;

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      {searchParams.get("welcome") && (
        <div className="mb-6 rounded border border-cyan/40 bg-cyan/10 p-4 text-sm text-cyan">
          Welcome to QueryRight. Your SQL workspace is ready.
        </div>
      )}
      <h1 className="text-3xl font-semibold text-white">Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}.</h1>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded border border-line bg-panel p-6">
          <p className="text-sm uppercase tracking-wider text-slate-500">Continue learning SQL</p>
          {nextChallenge ? (
            <>
              <h2 className="mt-4 text-2xl font-semibold text-white">Challenge {nextChallenge.id}: {nextChallenge.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{nextChallenge.difficulty} • {nextChallenge.topic}</p>
              <div className="mt-6 h-3 rounded bg-[#0a101b]">
                <div className="h-3 rounded bg-brand" style={{ width: `${Math.round((completedCount / Math.max(challenges.length, 1)) * 100)}%` }} />
              </div>
              <p className="mt-3 text-sm text-slate-400">{completedCount} / {challenges.length} challenges completed</p>
              <Link className="mt-6 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-white" href={`/challenge/${nextChallenge.id}`}>
                Continue Learning
              </Link>
            </>
          ) : (
            <>
              <h2 className="mt-4 text-2xl font-semibold text-white">You&apos;ve completed the first SQLBank challenge set.</h2>
              <Link className="mt-6 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-white" href="/challenge/1">Practice Again</Link>
            </>
          )}
        </div>

        <div className="rounded border border-line bg-panel p-6">
          <p className="text-sm uppercase tracking-wider text-slate-500">Your progress</p>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between"><span>Challenges Completed</span><span>{completedCount} / {challenges.length}</span></div>
            <div className="flex justify-between"><span>Current Goal</span><span>{profile?.selected_role ?? "SQL"}</span></div>
            <div className="flex justify-between"><span>Current Level</span><span>{profile?.sql_level ?? "Not set"}</span></div>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded border border-line bg-panel p-6">
        <p className="text-sm uppercase tracking-wider text-slate-500">Your skills</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {challenges.map((challenge) => {
            const done = completedIds.has(challenge.id);
            const started = progress.some((row) => row.challenge_id === challenge.id);
            return (
              <div className="flex items-center justify-between rounded border border-line bg-[#0b111d] p-3 text-sm" key={challenge.id}>
                <span>{skillForChallenge(challenge)}</span>
                <span className={done ? "text-success" : started ? "text-cyan" : "text-slate-500"}>{done ? "Completed" : started ? "Practicing" : "Not Started"}</span>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
