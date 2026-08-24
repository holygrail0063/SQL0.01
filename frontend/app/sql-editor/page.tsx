"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api, type Challenge } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getCourseForProfile, lessonUrl, nextLesson } from "@/lib/course";
import { getProfile, getProgress, type Profile, type ProgressRow } from "@/lib/progress";
import { lastSqlWorkspaceKey } from "@/lib/sql-editor-state";

export default function SqlEditorResumePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <SqlEditorResumeContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function SqlEditorResumeContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
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
      .catch((caught) => setError(caught instanceof Error ? caught.message : "SQL Editor could not find your current task."));
  }, [router, user]);

  const destination = useMemo(() => {
    if (!user || !profile) return null;
    const course = getCourseForProfile(profile);
    if (!course) return "/account/preferences";
    const last = typeof window === "undefined" ? null : window.localStorage.getItem(lastSqlWorkspaceKey(user.id));
    if (last && isSafeWorkspacePath(last)) return last;
    const lesson = nextLesson(course, progress);
    if (lesson) return lessonUrl(lesson);
    const completed = new Set(progress.filter((row) => row.status === "completed").map((row) => row.challenge_id));
    const practice = challenges.find((challenge) => !completed.has(challenge.id)) ?? challenges[0];
    return practice ? `/challenge/${practice.id}` : "/practice/sandbox";
  }, [challenges, profile, progress, user]);

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="font-mono text-sm text-cyan">SQL Editor</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">We could not restore your current task.</h1>
        <p className="status-error mt-6 rounded border p-3 text-sm">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="font-mono text-sm text-cyan">SQL Editor</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-50">Opening your current SQL task...</h1>
      <div className="mt-8 h-2 overflow-hidden rounded bg-elevated">
        <div className="h-full w-1/2 rounded bg-brand" />
      </div>
    </main>
  );
}

function isSafeWorkspacePath(path: string) {
  return path.startsWith("/learn/lesson/") || path.startsWith("/challenge/") || path === "/practice/sandbox";
}
