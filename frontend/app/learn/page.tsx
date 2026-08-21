"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api, Challenge } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { buildModuleProgress, getCourseForProfile, lessonUrl } from "@/lib/course";
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

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <p className="font-mono text-sm text-cyan">Business Analyst SQL Path</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">{course ? course.title : "Career pathway coming soon"}</h1>
      {course && <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{course.description}</p>}
      {error && (
        <div className="mt-6 rounded border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-100">
          Learning data could not be loaded. {error}
        </div>
      )}
      {!course && (
        <section className="mt-8 rounded border border-line bg-panel p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-cyan">Coming Soon</p>
          <h2 className="mt-3 text-xl font-semibold text-white">{profile?.selected_role ?? "This pathway"} is being built.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Business Analyst is the first working curriculum. Other learning goals remain selectable so future paths can plug into the same course engine.</p>
          <Link className="mt-6 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-white" href="/settings">Update Learning Path</Link>
        </section>
      )}
      <div className="mt-8 space-y-6">
        {moduleProgress.map(({ module, completedLessons, totalLessons, status, percent }) => (
          <section className="rounded border border-line bg-panel p-5" key={module.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-cyan">Module {module.sequence}</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{module.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{module.description}</p>
              </div>
              <div className="text-right text-sm">
                <div className={status === "Completed" ? "text-success" : status === "In Progress" ? "text-cyan" : status === "Locked" ? "text-slate-500" : "text-slate-300"}>
                  {status === "Locked" && <Lock className="mr-1 inline" size={14} />}
                  {status}
                </div>
                <div className="mt-1 text-slate-500">{completedLessons} / {totalLessons} lessons</div>
              </div>
            </div>
            <div className="mt-4 h-2 rounded bg-[#0a101b]">
              <div className="h-2 rounded bg-brand" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-4 divide-y divide-line">
              {module.lessons.map((lesson) => {
                const challenge = challenges.find((candidate) => candidate.id === lesson.challengeId);
                const completed = completedIds.has(lesson.challengeId);
                return (
                  <Link className="flex items-center justify-between gap-4 py-4 hover:text-white" href={lessonUrl(lesson)} key={lesson.id}>
                    <div className="flex items-center gap-3">
                      {completed ? <CheckCircle2 className="text-success" size={18} /> : <Circle className="text-slate-600" size={18} />}
                      <div>
                        <p className="font-medium text-white">{lesson.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{lesson.difficulty} • {lesson.estimatedMinutes} min • {lesson.skills.slice(0, 3).join(", ")}</p>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{challenge?.concept ?? lesson.concept}</p>
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
