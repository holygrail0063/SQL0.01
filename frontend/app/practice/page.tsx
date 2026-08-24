"use client";

import Link from "next/link";
import { BriefcaseBusiness, FlaskConical, Inbox, Layers3, TerminalSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api, type Challenge } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getCourseForProfile, lessonUrl, nextLesson } from "@/lib/course";
import { getProfile, getProgress, type Profile, type ProgressRow } from "@/lib/progress";

export default function PracticePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <PracticeContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function PracticeContent() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.challenges(), getProgress(user), getProfile(user)])
      .then(([challengeData, progressData, profileData]) => {
        setChallenges(challengeData);
        setProgress(progressData);
        setProfile(profileData);
        setError(null);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Practice data could not be loaded."))
      .finally(() => setLoading(false));
  }, [user]);

  const course = getCourseForProfile(profile);
  const daily = course ? nextLesson(course, progress) : null;
  const managerRequests = useMemo(() => {
    const requestIds = course?.learningModeId === "quick-interview-prep"
      ? [3, 7, 8, 10, 12, 15, 19, 20, 21, 24]
      : course?.learningModeId === "expert-study"
        ? [14, 15, 21, 22, 24, 25]
        : [8, 10, 11, 13, 14, 15, 19, 20, 21, 22, 23, 24, 25];
    return requestIds.map((id) => challenges.find((challenge) => challenge.id === id)).filter(Boolean) as Challenge[];
  }, [challenges, course?.learningModeId]);
  const investigations = managerRequests.filter((challenge) => ["Intermediate", "Advanced"].includes(challenge.difficulty));
  const capstoneId = course?.learningModeId === "expert-study" || course?.learningModeId === "comfortable-with-sql" ? 25 : 15;

  if (loading) return <main className="p-8 text-slate-400">Loading practice...</main>;
  if (error) return <main className="p-8 text-red-200">{error}</main>;
  if (!course) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="font-mono text-sm text-cyan">Practice</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Choose a learning mode to unlock practice.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Practice recommendations adapt to your selected SQL learning mode.</p>
        <Link className="mt-6 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground" href="/account/preferences">Update Learning Mode</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="font-mono text-sm text-cyan">Practice</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-50">Work through realistic SQL requests.</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
        Learn is structured teaching. Practice is where SQLBank starts to feel like a real analytics inbox: work requests, investigations, projects, and open-ended querying.
      </p>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded border border-line bg-panel p-6">
          <div className="flex items-center gap-2 text-cyan"><Inbox size={18} /><span className="font-mono text-xs uppercase tracking-wider">Daily SQL Question</span></div>
          {daily ? (
            <>
              <h2 className="mt-4 text-2xl font-semibold text-slate-50">{daily.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{daily.independentPrompt}</p>
              <Link className="mt-6 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground" href={lessonUrl(daily)}>Open SQL Question</Link>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-300">You have completed the current SQLBank practice set.</p>
          )}
        </div>
        <div className="rounded border border-line bg-panel p-6">
          <div className="flex items-center gap-2 text-cyan"><TerminalSquare size={18} /><span className="font-mono text-xs uppercase tracking-wider">Sandbox</span></div>
          <h2 className="mt-4 text-xl font-semibold text-slate-50">Sandbox</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Explore the training database without a required answer. The same read-only protections still apply.</p>
          <Link className="mt-6 inline-flex rounded border border-line px-4 py-2 text-sm font-semibold text-slate-200 hover:border-brand-strong/50" href="/practice/sandbox">Open Sandbox</Link>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2 text-cyan"><BriefcaseBusiness size={18} /><h2 className="text-xl font-semibold text-slate-50">SQLBank Work Requests</h2></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {managerRequests.map((challenge) => (
            <article className="rounded border border-line bg-panel p-5" key={challenge.id}>
              <p className="font-mono text-xs uppercase tracking-wider text-cyan">Request from manager</p>
              <h3 className="mt-3 text-lg font-semibold text-slate-50">{challenge.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{challenge.difficulty} • {challenge.topic}</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{challenge.description}</p>
              <Link className="mt-5 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground" href={`/challenge/${challenge.id}`}>Open Request</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="rounded border border-line bg-panel p-6">
          <div className="flex items-center gap-2 text-cyan"><FlaskConical size={18} /><h2 className="text-xl font-semibold text-slate-50">Investigations</h2></div>
          <div className="mt-4 divide-y divide-line">
            {investigations.map((challenge) => (
              <Link className="block py-4 hover:text-slate-50" href={`/challenge/${challenge.id}`} key={challenge.id}>
                <p className="font-semibold text-slate-50">{challenge.title}</p>
                <p className="mt-1 text-sm text-slate-400">{challenge.description}</p>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded border border-line bg-panel p-6">
          <div className="flex items-center gap-2 text-cyan"><Layers3 size={18} /><h2 className="text-xl font-semibold text-slate-50">Projects</h2></div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Capstone work asks you to choose metrics, validate grain, compare periods, and communicate what the data suggests.
          </p>
          <Link className="mt-6 inline-flex rounded border border-line px-4 py-2 text-sm font-semibold text-slate-200 hover:border-brand-strong/50" href={`/challenge/${capstoneId}`}>Open Capstone</Link>
        </div>
      </section>
    </main>
  );
}
