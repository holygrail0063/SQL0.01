"use client";

import Link from "next/link";
import { BarChart3, BriefcaseBusiness, Clock3, FlaskConical, RotateCcw, Target, TerminalSquare } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api, type Challenge } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  getCourseForProfile,
  getDailyCommitment,
  getLessonStages,
  lessonUrl,
  nextLesson,
  readinessScore,
  reviewDue,
  type CourseDefinition,
  type LessonDefinition,
} from "@/lib/course";
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

export default function SqlSpacePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <SqlSpaceContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function SqlSpaceContent() {
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
        setError(null);
      })
      .catch((caught) => setError(`SQL Space could not be loaded. ${readableError(caught)}`))
      .finally(() => setLoading(false));
  }, [router, user]);

  const completedIds = useMemo(() => new Set(progress.filter((row) => row.status === "completed").map((row) => row.challenge_id)), [progress]);
  const course = getCourseForProfile(profile);
  const dailyCommitment = getDailyCommitment(profile);
  const currentLesson = course ? nextLesson(course, progress) : null;
  const currentChallenge = currentLesson ? challenges.find((challenge) => challenge.id === currentLesson.challengeId) : null;
  const reviews = course ? reviewDue(course, progress) : [];
  const skillScore = course ? readinessScore(course, progress) : 0;
  const learnerName = profileDisplayName(profile, user);
  const roleName = course?.learningGoal ?? profile?.selected_role ?? "SQL";
  const isDataAnalyst = roleName === "Data Analyst";
  const recommendedAssignment = course ? findRecommendedAssignment(challenges, completedIds, isDataAnalyst) : null;
  const rotatingLesson = course ? rotatingPracticeLesson(course, progress) : null;
  const reviewLesson = course && reviews[0] ? findLessonForSkill(course, progress, reviews[0].skill) : currentLesson;
  const lessonStages = currentLesson ? getLessonStages(currentLesson) : [];

  if (loading) return <main className="p-8 text-slate-600">Loading SQL Space...</main>;
  if (error) return <main className="p-8 text-red-200">{error}</main>;

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      {searchParams.get("welcome") && (
        <div className="mb-6 rounded border border-cyan/40 bg-cyan/10 p-4 text-sm text-cyan">
          Welcome to QueryRight. SQL Space is ready.
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-cyan">QueryRight SQL Space</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Welcome back{learnerName ? `, ${learnerName}` : ""}.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">This is your workbench for today: continue the next lesson, review a skill, or open a SQLBank work request when you are ready for workplace-style practice.</p>
        </div>
        <Link className="inline-flex items-center gap-2 rounded border border-line px-4 py-2 text-sm font-semibold text-slate-800 hover:border-brand-strong/50" href="/progress">
          <BarChart3 size={16} />
          View Progress
        </Link>
      </div>

      {!course ? (
        <section className="mt-8 rounded border border-line bg-panel p-6">
          <p className="font-mono text-sm text-cyan">Coming Soon</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">{profile?.selected_role} pathway is being built.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">Business Analyst and Data Analyst are active today. Your selected goal is saved, and this page will activate when that pathway is available.</p>
          <Link className="mt-6 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950" href="/account/preferences">Choose A Working Path</Link>
        </section>
      ) : (
        <>
          <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="rounded border border-line bg-panel p-6">
              <p className="text-sm uppercase tracking-wider text-slate-500">{course.experienceLevel === "Interview Preparation" ? `${course.learningGoal} Interview Practice` : `Continue Your ${course.learningGoal} Path`}</p>
              {currentLesson && currentChallenge ? (
                <>
                  <h2 className="mt-4 text-2xl font-semibold text-slate-950">{currentLesson.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{currentLesson.difficulty} - {currentLesson.estimatedMinutes} minutes - {currentLesson.skills.slice(0, 3).join(", ")}</p>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-700">{currentLesson.businessContext}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link className="inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950" href={lessonUrl(currentLesson)}>
                      Continue Lesson
                    </Link>
                    <Link className="inline-flex rounded border border-line px-4 py-2 text-sm font-semibold text-slate-800 hover:border-brand-strong/50" href="/learn">View Curriculum</Link>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mt-4 text-2xl font-semibold text-slate-950">{course.learningGoal} SQL Path Complete</h2>
                  <p className="mt-3 text-sm text-slate-700">Review recommended skills or open Practice to keep your SQL fresh.</p>
                  <Link className="mt-6 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950" href="/practice">Open Practice</Link>
                </>
              )}
            </div>

            <div className="rounded border border-line bg-panel p-6">
              <p className="text-sm uppercase tracking-wider text-slate-500">SQL Skill Score</p>
              <div className="mt-4 text-5xl font-semibold text-slate-950">{skillScore}%</div>
              <p className="mt-3 text-sm leading-6 text-slate-600">Calculated from completed lessons and skill coverage in your selected path.</p>
              <div className="mt-6 h-3 rounded bg-slate-200">
                <div className="h-3 rounded bg-brand-strong" style={{ width: `${skillScore}%` }} />
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded border border-line bg-panel p-6">
              <div className="flex items-center gap-2 text-cyan">
                <Clock3 size={18} />
                <p className="font-mono text-xs uppercase tracking-wider">Today&apos;s Plan</p>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {lessonStages.map((stage) => (
                  <article className="rounded border border-line bg-elevated p-4" key={stage.id}>
                    <p className="font-mono text-xs uppercase tracking-wider text-cyan">{stageLabel(stage.type)}</p>
                    <h3 className="mt-2 font-semibold text-slate-950">{stage.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{stage.instructions.split("\n")[0]}</p>
                    <p className="mt-3 text-xs text-slate-500">{stage.estimatedMinutes} min</p>
                  </article>
                ))}
                {!lessonStages.length && (
                  <p className="text-sm text-slate-600">Choose a path to generate today&apos;s guided SQL plan.</p>
                )}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                <span>Daily commitment: {dailyCommitment} minutes</span>
                {currentLesson && <Link className="rounded bg-brand px-4 py-2 font-semibold text-slate-950" href={lessonUrl(currentLesson)}>Start Training</Link>}
              </div>
            </div>

            <div className="rounded border border-line bg-panel p-6">
              <div className="flex items-center gap-2 text-cyan">
                <Target size={18} />
                <p className="font-mono text-xs uppercase tracking-wider">Recommended Review</p>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950">{reviews.length} skills to practice</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {reviews.map((skill) => <span className="rounded border border-line px-2 py-1 text-xs text-slate-700" key={skill.skill}>{skill.skill}</span>)}
              </div>
              {reviewLesson && <Link className="mt-6 inline-flex rounded border border-line px-4 py-2 text-sm font-semibold text-slate-800 hover:border-brand-strong/50" href={lessonUrl(reviewLesson)}>Open Review</Link>}
            </div>
          </section>

          <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <QuickAction
              copy="Open the next lesson selected for your current role and SQL level."
              href={currentLesson ? lessonUrl(currentLesson) : "/learn"}
              icon={<Target size={18} />}
              label="Daily SQL Challenge"
            />
            <QuickAction
              copy="Practice the first skill currently marked for review."
              href={reviewLesson ? lessonUrl(reviewLesson) : "/learn"}
              icon={<RotateCcw size={18} />}
              label="Practice Recommended Skills"
            />
            <QuickAction
              copy="Try a rotating exercise from your active course path."
              href={rotatingLesson ? lessonUrl(rotatingLesson) : "/learn"}
              icon={<FlaskConical size={18} />}
              label="Rotating Practice"
            />
            <QuickAction
              copy="Explore the SQLBank database freely with read-only query protection."
              href="/practice/sandbox"
              icon={<TerminalSquare size={18} />}
              label="SQL Sandbox"
            />
          </section>

          <section className="mt-5 rounded border border-line bg-panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-cyan">
                  <BriefcaseBusiness size={18} />
                  <p className="font-mono text-xs uppercase tracking-wider">Recommended Practice</p>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-slate-950">{recommendedAssignment?.title ?? "Open Practice"}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                  {recommendedAssignment?.description ?? "Pick a realistic workplace request when you are ready to test your SQL in a less guided setting."}
                </p>
              </div>
              <Link className="inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950" href={recommendedAssignment ? `/challenge/${recommendedAssignment.id}` : "/practice"}>
                Open
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function QuickAction({ copy, href, icon, label }: { copy: string; href: string; icon: ReactNode; label: string }) {
  return (
    <Link className="rounded border border-line bg-panel p-5 hover:border-cyan/60 hover:text-slate-950" href={href}>
      <div className="text-cyan">{icon}</div>
      <h3 className="mt-4 font-semibold text-slate-950">{label}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
    </Link>
  );
}

function findRecommendedAssignment(challenges: Challenge[], completedIds: Set<number>, isDataAnalyst: boolean) {
  const ids = isDataAnalyst ? [18, 20, 21, 22, 23, 24, 25] : [8, 10, 11, 13, 14, 15];
  const options = ids.map((id) => challenges.find((challenge) => challenge.id === id)).filter(Boolean) as Challenge[];
  return options.find((challenge) => !completedIds.has(challenge.id)) ?? options[0] ?? null;
}

function rotatingPracticeLesson(course: CourseDefinition, progressRows: ProgressRow[]) {
  const completed = new Set(progressRows.filter((row) => row.status === "completed").map((row) => row.challenge_id));
  const lessons = course.modules.flatMap((module) => module.lessons).filter((lesson) => !completed.has(lesson.challengeId));
  if (!lessons.length) return course.modules[0]?.lessons[0] ?? null;
  return lessons[new Date().getDate() % lessons.length];
}

function findLessonForSkill(course: CourseDefinition, progressRows: ProgressRow[], skill: string): LessonDefinition | null {
  const completed = new Set(progressRows.filter((row) => row.status === "completed").map((row) => row.challenge_id));
  const lessons = course.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.skills.includes(skill));
  return lessons.find((lesson) => !completed.has(lesson.challengeId)) ?? lessons[0] ?? nextLesson(course, progressRows);
}

function stageLabel(type: string) {
  return type.replace(/_/g, " ");
}
