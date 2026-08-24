"use client";

import Link from "next/link";
import { Activity, BarChart3, CheckCircle2, Clock3, LineChart, Target, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api, type Challenge } from "@/lib/api";
import { buildDashboardAnalytics, getChallengeAttempts, type DashboardAnalytics, type DashboardRange } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { getCourseForProfile, type CourseDefinition } from "@/lib/course";
import { getProfile, getProgress, type Profile, type ProgressRow } from "@/lib/progress";

const rangeOptions: { label: string; value: DashboardRange }[] = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "All", value: "all" },
];

function readableError(caught: unknown) {
  if (caught instanceof Error) return caught.message;
  if (typeof caught === "string") return caught;
  try {
    return JSON.stringify(caught);
  } catch {
    return "Unknown error.";
  }
}

export default function ProgressPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ProgressContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ProgressContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [attempts, setAttempts] = useState<Awaited<ReturnType<typeof getChallengeAttempts>>>([]);
  const [range, setRange] = useState<DashboardRange>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getProfile(user), getProgress(user), api.challenges(), getChallengeAttempts(user)])
      .then(([profileData, progressData, challengeData, attemptData]) => {
        if (!profileData?.onboarding_completed) {
          router.replace("/onboarding");
          return;
        }
        setProfile(profileData);
        setProgress(progressData);
        setChallenges(challengeData);
        setAttempts(attemptData);
        setError(null);
      })
      .catch((caught) => setError(`Progress data could not be loaded. ${readableError(caught)}`))
      .finally(() => setLoading(false));
  }, [router, user]);

  const course = getCourseForProfile(profile);
  const analytics = useMemo(() => {
    if (!course) return null;
    return buildDashboardAnalytics(course, progress, challenges, attempts, range);
  }, [attempts, challenges, course, progress, range]);

  if (loading) return <main className="p-8 text-slate-400">Loading progress analytics...</main>;
  if (error) return <main className="p-8 text-red-200">{error}</main>;

  if (!course || !analytics) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="font-mono text-sm text-cyan">Progress</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Choose a supported path to unlock analytics.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Business Analyst and Data Analyst progress views are available today.</p>
        <Link className="mt-6 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950" href="/account/preferences">Update Learning Path</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-cyan">Learning progress</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-50">Your SQL Progress</h1>
          <p className="mt-2 text-sm text-slate-400">{course.learningGoal} - {course.experienceLevel}</p>
        </div>
        <RangeSelector range={range} setRange={setRange} />
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Target size={18} />} label="SQL Skill Score" value={`${analytics.summary.readiness}%`} detail="Course skill coverage from completed lessons" />
        <MetricCard icon={<BarChart3 size={18} />} label="Course Progress" value={`${analytics.summary.courseProgress}%`} detail={`${analytics.summary.completedLessons} of ${analytics.summary.totalLessons} lessons completed`} />
        <MetricCard icon={<CheckCircle2 size={18} />} label="Query Accuracy" value={formatPercent(analytics.summary.accuracy)} detail={`${analytics.summary.correctAttempts} correct of ${analytics.summary.totalAttempts} attempts in range`} />
        <MetricCard icon={<Activity size={18} />} label="Practice Streak" value={`${analytics.summary.currentStreak} days`} detail={`Best streak: ${analytics.summary.longestStreak} days`} />
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        <MetricCard icon={<TrendingUp size={18} />} label="First-Try Accuracy" value={formatPercent(analytics.problemSolving.firstTryAccuracy)} detail={`${analytics.problemSolving.firstTryCorrect} first tries correct of ${analytics.problemSolving.firstTryTotal} problems`} />
        <MetricCard icon={<Clock3 size={18} />} label="Avg Attempts To Solve" value={analytics.problemSolving.averageAttemptsToSolve === null ? "--" : String(analytics.problemSolving.averageAttemptsToSolve)} detail="Completed problems only" />
        <MetricCard icon={<LineChart size={18} />} label="Problems Solved" value={String(analytics.summary.solvedChallenges)} detail={`${analytics.summary.attemptedQueries} total query attempts recorded`} />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="SQL Activity">
          <ActivityBars analytics={analytics} />
        </Panel>
        <Panel title="Accuracy Trend">
          <AccuracyTrend analytics={analytics} />
        </Panel>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel title="Skill Mastery">
          <div className="space-y-4">
            {analytics.skillMastery.slice(0, 10).map((skill) => (
              <ProgressRow key={skill.skill} label={skill.skill} value={skill.mastery} detail={`${skill.correctAttempts}/${skill.attempts} attempts correct`} />
            ))}
          </div>
        </Panel>
        <Panel title={`${course.learningGoal} Path Mastery`}>
          <div className="space-y-4">
            {analytics.careerReadiness.map((area) => (
              <ProgressRow key={area.label} label={area.label} value={area.score} detail={area.skills.slice(0, 3).join(", ")} />
            ))}
          </div>
        </Panel>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Focus Areas">
          <div className="grid gap-3">
            {analytics.focusAreas.map((skill) => (
              <Link className="rounded border border-line bg-elevated p-4 hover:border-cyan/60" href={skill.practiceHref} key={skill.skill}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-50">{skill.skill}</span>
                  <span className="text-sm text-slate-400">{skill.mastery}%</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">Practice this skill in your active course path.</p>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel title="Recent Query Activity">
          <RecentActivityList analytics={analytics} />
        </Panel>
      </section>
    </main>
  );
}

function RangeSelector({ range, setRange }: { range: DashboardRange; setRange: (value: DashboardRange) => void }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-panel p-1">
      {rangeOptions.map((option) => (
        <button
          className={range === option.value ? "rounded-full bg-brand px-3 py-2 text-sm font-semibold text-slate-950" : "rounded-full px-3 py-2 text-sm text-slate-400 hover:bg-brand/20 hover:text-slate-50"}
          key={option.value}
          onClick={() => setRange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function MetricCard({ detail, icon, label, value }: { detail: string; icon: ReactNode; label: string; value: string }) {
  return (
    <article className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center gap-2 text-cyan">{icon}<p className="font-mono text-xs uppercase tracking-wider">{label}</p></div>
      <div className="mt-4 text-3xl font-semibold text-slate-50">{value}</div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </article>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-line bg-panel p-6">
      <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ActivityBars({ analytics }: { analytics: DashboardAnalytics }) {
  const visible = analytics.activitySeries.filter((point) => point.attempts > 0).length;
  const max = Math.max(...analytics.activitySeries.map((point) => point.attempts), 1);
  if (!visible) return <EmptyState text="No query attempts recorded in this range yet." />;

  return (
    <div className="flex h-56 items-end gap-2 overflow-x-auto pb-2">
      {analytics.activitySeries.map((point) => (
        <div className="flex min-w-8 flex-1 flex-col items-center gap-2" key={point.dateKey}>
          <div className="flex h-40 w-full items-end rounded bg-elevated px-1">
            <div className="w-full rounded bg-brand-strong" style={{ height: `${Math.max(6, (point.attempts / max) * 100)}%` }} title={`${point.attempts} attempts`} />
          </div>
          <span className="whitespace-nowrap text-[11px] text-slate-500">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function AccuracyTrend({ analytics }: { analytics: DashboardAnalytics }) {
  if (analytics.accuracyTrend.length < 2) return <EmptyState text="Accuracy trend appears after attempts in at least two weekly buckets." />;
  const width = 520;
  const height = 180;
  const points = analytics.accuracyTrend.map((point, index) => {
    const x = analytics.accuracyTrend.length === 1 ? 0 : (index / (analytics.accuracyTrend.length - 1)) * width;
    const y = height - (point.accuracy / 100) * height;
    return { ...point, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg className="min-w-[520px]" height={height + 44} role="img" viewBox={`0 0 ${width} ${height + 44}`} width={width}>
        <path d={path} fill="none" stroke="#4d7c0f" strokeWidth="3" />
        {points.map((point) => (
          <g key={`${point.label}-${point.accuracy}`}>
            <circle cx={point.x} cy={point.y} fill="#bef264" r="5" stroke="#4d7c0f" />
            <text fill="#94a3b8" fontSize="11" textAnchor="middle" x={point.x} y={height + 24}>{point.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ProgressRow({ detail, label, value }: { detail: string; label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-sm">
        <span className="text-slate-200">{label}</span>
        <span className="text-slate-50">{value}%</span>
      </div>
      <div className="h-2 rounded bg-slate-800">
        <div className="h-2 rounded bg-brand-strong" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function RecentActivityList({ analytics }: { analytics: DashboardAnalytics }) {
  if (!analytics.recentActivity.length) return <EmptyState text="Recent query attempts will appear here after you run SQL." />;
  return (
    <div className="divide-y divide-line">
      {analytics.recentActivity.map((activity) => (
        <Link className="flex items-center justify-between gap-4 py-3 hover:text-slate-50" href={`/challenge/${activity.challengeId}`} key={`${activity.challengeId}-${activity.attemptedAt}`}>
          <div>
            <p className="font-semibold text-slate-50">{activity.title}</p>
            <p className="mt-1 text-sm text-slate-500">{new Date(activity.attemptedAt).toLocaleString()}</p>
          </div>
          <span className={activity.isCorrect ? "text-success" : "text-red-200"}>{activity.isCorrect ? "Correct" : "Incorrect"}</span>
        </Link>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded border border-line bg-elevated p-6 text-sm text-slate-400">{text}</div>;
}

function formatPercent(value: number | null) {
  return value === null ? "--" : `${value}%`;
}
