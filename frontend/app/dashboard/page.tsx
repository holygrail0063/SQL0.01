"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api, Challenge } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { courseCompletionPercent, deriveSkillMastery, getCourseForProfile, getDailyCommitment, lessonUrl, nextLesson, readinessScore, reviewDue, weeklyProgress } from "@/lib/course";
import { getProfile, getProgress, profileDisplayName, type Profile, type ProgressRow } from "@/lib/progress";

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
  const course = getCourseForProfile(profile);
  const dailyCommitment = getDailyCommitment(profile);
  const currentLesson = course ? nextLesson(course, progress) : null;
  const currentChallenge = currentLesson ? challenges.find((challenge) => challenge.id === currentLesson.challengeId) : null;
  const completion = course ? courseCompletionPercent(course, progress) : 0;
  const readiness = course ? readinessScore(course, progress) : 0;
  const skillSnapshot = course ? deriveSkillMastery(course, progress).slice(0, 5) : [];
  const weekly = weeklyProgress(progress);
  const reviews = course ? reviewDue(course, progress) : [];
  const completedCount = completedIds.size;
  const learnerName = profileDisplayName(profile, user);

  if (loading) return <main className="p-8 text-slate-400">Loading dashboard...</main>;
  if (error) return <main className="p-8 text-red-200">{error}</main>;

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      {searchParams.get("welcome") && (
        <div className="mb-6 rounded border border-cyan/40 bg-cyan/10 p-4 text-sm text-cyan">
          Welcome to QueryRight. Your SQL workspace is ready.
        </div>
      )}
      <h1 className="text-3xl font-semibold text-white">Welcome back{learnerName ? `, ${learnerName}` : ""}.</h1>

      {!course ? (
        <section className="mt-8 rounded border border-line bg-panel p-6">
          <p className="font-mono text-sm text-cyan">Coming Soon</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{profile?.selected_role} pathway is being built.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Business Analyst is the active curriculum today. Your selected goal is saved, and this page will activate when that pathway is available.</p>
          <Link className="mt-6 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-white" href="/settings">Choose Business Analyst</Link>
        </section>
      ) : (
        <>
          <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="rounded border border-line bg-panel p-6">
              <p className="text-sm uppercase tracking-wider text-slate-500">{course.experienceLevel === "Interview Preparation" ? "SQL Interview Preparation" : "Continue Your Business Analyst Path"}</p>
              {currentLesson && currentChallenge ? (
                <>
                  <h2 className="mt-4 text-2xl font-semibold text-white">
                    {course.experienceLevel === "Interview Preparation" ? "Today's interview practice" : `Day ${Math.max(1, completedCount + 1)} - ${currentLesson.title}`}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">{currentLesson.difficulty} • {currentLesson.estimatedMinutes} minutes • {currentLesson.skills.slice(0, 3).join(", ")}</p>
                  <div className="mt-5 rounded border border-line bg-[#0a1322] p-4">
                    <p className="text-sm font-semibold text-white">Today&apos;s plan</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                      <li>3 min - Concept</li>
                      <li>5 min - Guided practice</li>
                      <li>{Math.max(6, dailyCommitment - 15)} min - SQLBank assignment</li>
                      <li>5 min - Review checkpoint</li>
                      <li>2 min - Business interpretation</li>
                    </ul>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link className="inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-white" href={lessonUrl(currentLesson)}>
                      {course.experienceLevel === "Interview Preparation" ? "Start Interview Practice" : "Continue Learning"}
                    </Link>
                    <Link className="inline-flex rounded border border-line px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan/70" href="/learn">View Course</Link>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mt-4 text-2xl font-semibold text-white">Business Analyst SQL Path Complete</h2>
                  <p className="mt-3 text-sm text-slate-300">Review weak areas or revisit SQLBank assignments to keep skills fresh.</p>
                  <Link className="mt-6 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-white" href="/sqlbank">Open SQLBank</Link>
                </>
              )}
            </div>

            <div className="rounded border border-line bg-panel p-6">
              <p className="text-sm uppercase tracking-wider text-slate-500">Current SQL Readiness</p>
              <div className="mt-4 text-5xl font-semibold text-white">{readiness}%</div>
              <p className="mt-3 text-sm leading-6 text-slate-400">Building toward workplace-ready Business Analyst SQL.</p>
              <div className="mt-6 h-3 rounded bg-[#0a101b]">
                <div className="h-3 rounded bg-brand" style={{ width: `${readiness}%` }} />
              </div>
              <div className="mt-5 text-sm text-slate-400">Course progress: {completion}%</div>
            </div>
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="rounded border border-line bg-panel p-6">
              <p className="text-sm uppercase tracking-wider text-slate-500">Skill Snapshot</p>
              <div className="mt-5 space-y-4">
                {skillSnapshot.map((skill) => (
                  <div key={skill.skill}>
                    <div className="mb-1 flex justify-between text-sm"><span>{skill.skill}</span><span>{skill.mastery}%</span></div>
                    <div className="h-2 rounded bg-[#0a101b]"><div className="h-2 rounded bg-cyan" style={{ width: `${skill.mastery}%` }} /></div>
                  </div>
                ))}
              </div>
              <Link className="mt-5 inline-flex text-sm font-semibold text-cyan hover:text-white" href="/profile">View All Skills</Link>
            </div>
            <div className="rounded border border-line bg-panel p-6">
              <p className="text-sm uppercase tracking-wider text-slate-500">Weekly Progress</p>
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <div className="flex justify-between"><span>Lessons completed</span><span>{weekly.lessonsCompleted}</span></div>
                <div className="flex justify-between"><span>Exercises solved</span><span>{weekly.exercisesSolved}</span></div>
                <div className="flex justify-between"><span>Minutes practiced</span><span>{weekly.minutesPracticed}</span></div>
                <div className="flex justify-between"><span>Current streak</span><span>{weekly.currentStreak} days</span></div>
                <div className="flex justify-between"><span>SQLBank assignments</span><span>{weekly.assignments}</span></div>
              </div>
            </div>
            <div className="rounded border border-line bg-panel p-6">
              <p className="text-sm uppercase tracking-wider text-slate-500">Review Due</p>
              <h2 className="mt-4 text-xl font-semibold text-white">{reviews.length} concepts need review</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {reviews.map((skill) => <span className="rounded border border-line px-2 py-1 text-xs text-slate-300" key={skill.skill}>{skill.skill}</span>)}
              </div>
              {currentLesson && <Link className="mt-6 inline-flex rounded border border-line px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan/70" href={lessonUrl(currentLesson)}>Start 8-minute review</Link>}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
