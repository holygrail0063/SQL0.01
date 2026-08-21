"use client";

import Link from "next/link";
import { BriefcaseBusiness, FlaskConical, Inbox, Layers3, TerminalSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api, type Challenge } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getBusinessAnalystCourse, lessonUrl, nextLesson } from "@/lib/course";
import { getProfile, getProgress, type ProgressRow } from "@/lib/progress";

export default function SqlBankPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <SqlBankContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function SqlBankContent() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [level, setLevel] = useState("Completely New");

  useEffect(() => {
    if (!user) return;
    Promise.all([api.challenges(), getProgress(user), getProfile(user)]).then(([challengeData, progressData, profile]) => {
      setChallenges(challengeData);
      setProgress(progressData);
      setLevel(profile?.sql_level ?? "Completely New");
    });
  }, [user]);

  const course = getBusinessAnalystCourse(level);
  const daily = nextLesson(course, progress);
  const managerRequests = useMemo(() => [8, 10, 11, 13, 14, 15].map((id) => challenges.find((challenge) => challenge.id === id)).filter(Boolean) as Challenge[], [challenges]);
  const investigations = managerRequests.filter((challenge) => ["Intermediate", "Advanced"].includes(challenge.difficulty));

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="font-mono text-sm text-cyan">SQLBank workplace simulation</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">Work through realistic Business Analyst requests.</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Learn is structured teaching. SQLBank is where the work starts to feel like a real inbox: requests, investigations, projects, and open-ended querying.</p>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded border border-line bg-panel p-6">
          <div className="flex items-center gap-2 text-cyan"><Inbox size={18} /><span className="font-mono text-xs uppercase tracking-wider">Daily Assignment</span></div>
          {daily ? (
            <>
              <h2 className="mt-4 text-2xl font-semibold text-white">{daily.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{daily.independentPrompt}</p>
              <Link className="mt-6 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-white" href={lessonUrl(daily)}>Open Assignment</Link>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-300">You have completed the current SQLBank assignment set.</p>
          )}
        </div>
        <div className="rounded border border-line bg-panel p-6">
          <div className="flex items-center gap-2 text-cyan"><TerminalSquare size={18} /><span className="font-mono text-xs uppercase tracking-wider">Sandbox</span></div>
          <h2 className="mt-4 text-xl font-semibold text-white">Free Query SQLBank</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Explore the training database without a required answer. The same read-only protections still apply.</p>
          <Link className="mt-6 inline-flex rounded border border-line px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan/70" href="/sqlbank/sandbox">Open Sandbox</Link>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2 text-cyan"><BriefcaseBusiness size={18} /><h2 className="text-xl font-semibold text-white">Manager Requests</h2></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {managerRequests.map((challenge) => (
            <article className="rounded border border-line bg-panel p-5" key={challenge.id}>
              <p className="font-mono text-xs uppercase tracking-wider text-cyan">Incoming Request</p>
              <h3 className="mt-3 text-lg font-semibold text-white">{challenge.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{challenge.difficulty} • {challenge.topic}</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{challenge.description}</p>
              <Link className="mt-5 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-white" href={`/challenge/${challenge.id}`}>Open Assignment</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="rounded border border-line bg-panel p-6">
          <div className="flex items-center gap-2 text-cyan"><FlaskConical size={18} /><h2 className="text-xl font-semibold text-white">Investigations</h2></div>
          <div className="mt-4 divide-y divide-line">
            {investigations.map((challenge) => (
              <Link className="block py-4 hover:text-white" href={`/challenge/${challenge.id}`} key={challenge.id}>
                <p className="font-semibold text-white">{challenge.title}</p>
                <p className="mt-1 text-sm text-slate-400">{challenge.description}</p>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded border border-line bg-panel p-6">
          <div className="flex items-center gap-2 text-cyan"><Layers3 size={18} /><h2 className="text-xl font-semibold text-white">Projects</h2></div>
          <p className="mt-4 text-sm leading-6 text-slate-300">Capstone work unlocks as you build enough SQL readiness. Start with branch performance, approval rate, and operational reporting assignments.</p>
          <Link className="mt-6 inline-flex rounded border border-line px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan/70" href="/challenge/15">Open Capstone</Link>
        </div>
      </section>
    </main>
  );
}
