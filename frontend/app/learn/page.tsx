"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api, Challenge } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { buildModuleProgress, getCourseForProfile, isModuleBeforeRecommendedStart, lessonUrl } from "@/lib/course";
import { getLearningMode } from "@/lib/curriculum";
import { getProfile, getProgress, type Profile, type ProgressRow } from "@/lib/progress";

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
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
      .catch((caught) => {
        const message = caught instanceof Error ? caught.message : "Learning data could not be loaded.";
        setError(message);
      });
  }, [user]);

  const completedIds = useMemo(() => new Set(progress.filter((row) => row.status === "completed").map((row) => row.challenge_id)), [progress]);
  const course = getCourseForProfile(profile);
  const moduleProgress = course ? buildModuleProgress(course, progress) : [];

  if (!course) {
    const mode = getLearningMode(profile?.sql_level);
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="font-mono text-sm text-brand">Your SQL Path</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">{mode.label}</h1>
        <div className="mt-6 rounded-lg border border-line bg-panel p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-slate-500">Coming Soon</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">We're still building this learning experience. Beginner and Quick Interview Prep are active right now.</p>
          <Link className="mt-5 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground" href="/account/preferences">Switch Learning Mode</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <p className="font-mono text-sm text-brand">Your SQL Path</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-50">{course.title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{course.description}</p>
      <p className="mt-2 text-sm text-slate-500">{course.moduleCountLabel} • {course.questionCountLabel} • Self-paced</p>
      {error && (
        <div className="mt-6 rounded border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-100">
          Learning data could not be loaded. {error}
        </div>
      )}
      <div className="mt-8 space-y-6">
        {moduleProgress.map(({ module, completedQuestions, totalQuestions, status, percent }) => {
          const optionalReview = isModuleBeforeRecommendedStart(course, module);
          return (
          <section className="rounded border border-line bg-panel p-5" key={module.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-brand">Module {module.sequence}{optionalReview ? " • Optional Review" : ""}</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-50">{module.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{module.description}</p>
              </div>
              <div className="text-right text-sm">
                <div className={status === "Completed" ? "text-success" : status === "In Progress" ? "text-brand" : status === "Locked" ? "text-slate-500" : "text-slate-300"}>
                  {status}
                </div>
                <div className="mt-1 text-slate-500">{completedQuestions} / {totalQuestions} questions</div>
              </div>
            </div>
            <div className="mt-4 h-2 rounded bg-slate-800">
              <div className="h-2 rounded bg-brand" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-4 divide-y divide-line">
              {module.lessons.map((lesson) => {
                const challenge = challenges.find((candidate) => candidate.id === lesson.challengeId);
                const completed = completedIds.has(lesson.challengeId);
                const rowClass = "flex items-center justify-between gap-4 py-4 hover:text-slate-50";
                const content = (
                  <>
                    <div className="flex items-center gap-3">
                      {completed ? <CheckCircle2 className="text-success" size={18} /> : <Circle className="text-slate-400" size={18} />}
                      <div>
                        <p className="font-medium text-slate-50">{lesson.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{lesson.difficulty} • {lesson.estimatedMinutes} min • {lesson.skills.slice(0, 3).join(", ")}</p>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{challenge?.concept ?? lesson.concept}</p>
                      </div>
                    </div>
                    <span className={completed ? "text-success" : "text-brand"}>{completed ? "Completed" : "Open SQL Editor"}</span>
                  </>
                );
                return (
                  <Link className={rowClass} href={lessonUrl(lesson)} key={lesson.id}>
                    {content}
                  </Link>
                );
              })}
            </div>
          </section>
          );
        })}
      </div>
    </main>
  );
}
