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
  const isDataAnalyst = course?.learningGoal === "Data Analyst";
  const managerRequests = useMemo(() => {
    const requestIds = isDataAnalyst ? [18, 20, 21, 22, 23, 24, 25] : [8, 10, 11, 13, 14, 15];
    return requestIds.map((id) => challenges.find((challenge) => challenge.id === id)).filter(Boolean) as Challenge[];
  }, [challenges, isDataAnalyst]);
  const investigations = managerRequests.filter((challenge) => ["Intermediate", "Advanced"].includes(challenge.difficulty));
  const capstoneId = isDataAnalyst ? 25 : 15;

  if (loading) return <main className="p-8 text-slate-400">Loading practice...</main>;
  if (error) return <main className="p-8 text-red-200">{error}</main>;
  if (!course) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="font-mono text-sm text-cyan">Practice</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">{profile?.selected_role ?? "This"} path is coming soon.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Business Analyst and Data Analyst are available today. Choose one in Learning Preferences to unlock role-specific SQLBank assignments.</p>
        <Link className="mt-6 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950" href="/account/preferences">Update Learning Path</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="font-mono text-sm text-cyan">Practice</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-50">Work through realistic {course.learningGoal} requests.</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
        {isDataAnalyst
          ? "Learn is structured teaching. Practice is where SQLBank starts to feel like a real analytics inbox: daily analysis, stakeholder requests, data challenges, investigations, and open-ended querying."
          : "Learn is structured teaching. Practice is where SQLBank starts to feel like a real inbox: work requests, investigations, projects, and open-ended querying."}
      </p>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded border border-line bg-panel p-6">
          <div className="flex items-center gap-2 text-cyan"><Inbox size={18} /><span className="font-mono text-xs uppercase tracking-wider">{isDataAnalyst ? "Daily Analysis" : "Daily Assignment"}</span></div>
          {daily ? (
            <>
              <h2 className="mt-4 text-2xl font-semibold text-slate-50">{daily.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{daily.independentPrompt}</p>
              <Link className="mt-6 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950" href={lessonUrl(daily)}>{isDataAnalyst ? "Open Analysis" : "Open Assignment"}</Link>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-300">You have completed the current SQLBank {isDataAnalyst ? "analysis" : "assignment"} set.</p>
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
              <Link className="mt-5 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950" href={`/challenge/${challenge.id}`}>{isDataAnalyst ? "Open Analysis" : "Open Assignment"}</Link>
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
            {isDataAnalyst
              ? "Capstone work asks you to choose metrics, validate grain, compare periods, and communicate what the data suggests."
              : "Capstone work unlocks as your SQL skill score improves. Start with branch performance, approval rate, and operational reporting assignments."}
          </p>
          <Link className="mt-6 inline-flex rounded border border-line px-4 py-2 text-sm font-semibold text-slate-200 hover:border-brand-strong/50" href={`/challenge/${capstoneId}`}>Open Capstone</Link>
        </div>
      </section>
    </main>
  );
}
