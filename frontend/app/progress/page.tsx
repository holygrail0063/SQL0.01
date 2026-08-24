"use client";

import Link from "next/link";
import { Activity, BarChart3, CheckCircle2, ListChecks } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api, type Challenge } from "@/lib/api";
import { buildDashboardAnalytics, getChallengeAttempts, type DashboardAnalytics, type DashboardRange, type SkillInsight } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { buildModuleProgress, getCourseForProfile, type ModuleProgress } from "@/lib/course";
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
  const moduleProgress = useMemo(() => (course ? buildModuleProgress(course, progress) : []), [course, progress]);

  if (loading) return <main className="p-8 text-slate-400">Loading progress analytics...</main>;
  if (error) return <main className="p-8 text-red-200">{error}</main>;

  if (!course || !analytics) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="font-mono text-sm text-cyan">Progress</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Choose a supported path to unlock analytics.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Business Analyst and Data Analyst progress views are available today.</p>
        <Link className="mt-6 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground" href="/account/preferences">Update Learning Path</Link>
      </main>
    );
  }

  const encounteredSkills = analytics.skillMastery.filter((skill) => skill.mastery > 0 || skill.attempts > 0);
  const upcomingSkills = analytics.skillMastery.filter((skill) => !encounteredSkills.some((encountered) => encountered.skill === skill.skill)).slice(0, 4);
  const focusAreas = analytics.summary.solvedChallenges >= 5
    ? encounteredSkills.filter((skill) => skill.attempts >= 3 && skill.mastery < 70).sort((a, b) => a.mastery - b.mastery).slice(0, 3)
    : [];
  const currentModule = currentModuleProgress(moduleProgress);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-cyan">Learning progress</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-50">Your SQL Progress</h1>
          <p className="mt-2 text-sm text-slate-400">{course.learningGoal} · {course.experienceLevel}</p>
        </div>
        <RangeSelector range={range} setRange={setRange} />
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<BarChart3 size={18} />} label="Course Progress" value={`${analytics.summary.courseProgress}%`} detail={`${analytics.summary.completedLessons} of ${analytics.summary.totalLessons} lessons completed`} />
        <MetricCard icon={<ListChecks size={18} />} label="Problems Solved" value={String(analytics.summary.solvedChallenges)} detail={`${analytics.summary.attemptedQueries} total query attempts`} />
        <MetricCard
          icon={<CheckCircle2 size={18} />}
          label="Query Accuracy"
          value={analytics.summary.totalAttempts >= 2 ? formatPercent(analytics.summary.accuracy) : "Not enough data yet"}
          detail={analytics.summary.totalAttempts >= 2 ? `${analytics.summary.correctAttempts} correct of ${analytics.summary.totalAttempts} attempts in range` : "Complete a few SQL questions to start tracking accuracy."}
          mutedValue={analytics.summary.totalAttempts < 2}
        />
        <MetricCard icon={<Activity size={18} />} label="Practice Streak" value={`${analytics.summary.currentStreak} days`} detail={`Best streak: ${analytics.summary.longestStreak} days`} />
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <p className="font-mono text-xs uppercase tracking-wider text-cyan">Learning Progress</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-50">{course.shortTitle}</h2>
                <p className="mt-1 text-sm text-slate-400">{analytics.summary.completedLessons} of {analytics.summary.totalLessons} lessons completed</p>
              </div>
              <span className="text-2xl font-semibold text-slate-50">{analytics.summary.courseProgress}%</span>
            </div>
            <div className="mt-4 h-3 rounded-full bg-elevated">
              <div className="h-3 rounded-full bg-brand" style={{ width: `${analytics.summary.courseProgress}%` }} />
            </div>
          </div>
          {currentModule && <CurrentModuleSummary moduleProgress={currentModule} />}
        </div>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        <Panel title="Skill Mastery">
          <SkillMasteryPanel encounteredSkills={encounteredSkills} upcomingSkills={upcomingSkills} />
        </Panel>
        <Panel title={`Activity - ${rangeLabel(range)}`}>
          <ActivityBars analytics={analytics} range={range} />
        </Panel>
      </section>

      {focusAreas.length > 0 && (
        <section className="mt-8">
          <p className="font-mono text-xs uppercase tracking-wider text-cyan">Focus Areas</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {focusAreas.map((skill) => (
              <Link className="rounded-lg border border-line bg-panel p-4 hover:border-cyan/60" href={skill.practiceHref} key={skill.skill}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-50">{skill.skill}</span>
                  <span className="text-sm text-slate-400">{skill.mastery}%</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{skill.correctAttempts} correct of {skill.attempts} attempts</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8 border-t border-line pt-8">
        <p className="font-mono text-xs uppercase tracking-wider text-cyan">Recent Activity</p>
        <div className="mt-4">
          <RecentActivityList analytics={analytics} />
        </div>
      </section>
    </main>
  );
}

function RangeSelector({ range, setRange }: { range: DashboardRange; setRange: (value: DashboardRange) => void }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-panel p-1">
      {rangeOptions.map((option) => (
        <button
          className={range === option.value ? "rounded-full bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground" : "rounded-full px-3 py-2 text-sm text-slate-400 hover:bg-brand/20 hover:text-slate-50"}
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

function MetricCard({ detail, icon, label, mutedValue = false, value }: { detail: string; icon: ReactNode; label: string; mutedValue?: boolean; value: string }) {
  return (
    <article className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center gap-2 text-cyan">{icon}<p className="font-mono text-xs uppercase tracking-wider">{label}</p></div>
      <div className={mutedValue ? "mt-4 text-lg font-semibold text-slate-300" : "mt-4 text-3xl font-semibold text-slate-50"}>{value}</div>
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

function CurrentModuleSummary({ moduleProgress }: { moduleProgress: ModuleProgress }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-5">
      <p className="font-mono text-xs uppercase tracking-wider text-cyan">Current Module</p>
      <h3 className="mt-2 text-lg font-semibold text-slate-50">{moduleProgress.module.title}</h3>
      <p className="mt-2 text-sm text-slate-400">{moduleProgress.completedLessons} of {moduleProgress.totalLessons} lessons completed</p>
      <div className="mt-4 h-2 rounded-full bg-elevated">
        <div className="h-2 rounded-full bg-brand-strong" style={{ width: `${moduleProgress.percent}%` }} />
      </div>
    </div>
  );
}

function SkillMasteryPanel({ encounteredSkills, upcomingSkills }: { encounteredSkills: SkillInsight[]; upcomingSkills: SkillInsight[] }) {
  if (!encounteredSkills.length) {
    return (
      <div>
        <p className="text-sm leading-6 text-slate-400">Complete your first SQL questions to start building skill mastery.</p>
        {upcomingSkills.length > 0 && <UpNextSkills skills={upcomingSkills} />}
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {encounteredSkills.slice(0, 6).map((skill) => (
          <ProgressRow key={skill.skill} label={skill.skill} value={skill.mastery} detail={skill.attempts > 0 ? `${skill.correctAttempts}/${skill.attempts} attempts correct` : "Lesson progress evidence"} />
        ))}
      </div>
      {upcomingSkills.length > 0 && <UpNextSkills skills={upcomingSkills} />}
    </div>
  );
}

function UpNextSkills({ skills }: { skills: SkillInsight[] }) {
  return (
    <div className="mt-6 border-t border-line pt-5">
      <p className="font-mono text-xs uppercase tracking-wider text-cyan">Up Next</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span className="rounded-full border border-line bg-elevated px-3 py-1 text-sm text-slate-300" key={skill.skill}>{skill.skill}</span>
        ))}
      </div>
    </div>
  );
}

function ActivityBars({ analytics, range }: { analytics: DashboardAnalytics; range: DashboardRange }) {
  const activeDays = analytics.activitySeries.filter((point) => point.attempts > 0).length;
  const totalAttempts = analytics.activitySeries.reduce((sum, point) => sum + point.attempts, 0);
  const visibleSeries = displayActivitySeries(analytics.activitySeries, range);
  const max = Math.max(...visibleSeries.map((point) => point.attempts), 1);
  if (!activeDays) return <EmptyState text="No query attempts recorded in this range yet." />;

  return (
    <div>
      <div className="flex h-24 items-end gap-1.5">
        {visibleSeries.map((point) => (
          <div className="flex min-w-1 flex-1 items-end rounded bg-elevated px-0.5" key={point.dateKey} title={`${point.label}: ${point.attempts} attempts`}>
            <div
              className={point.attempts > 0 ? "w-full rounded bg-brand-strong" : "w-full rounded bg-slate-800/70"}
              style={{ height: point.attempts > 0 ? `${Math.max(12, (point.attempts / max) * 100)}%` : "8%" }}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
        <span>{activeDays} active {activeDays === 1 ? "day" : "days"}</span>
        <span>{totalAttempts} query {totalAttempts === 1 ? "attempt" : "attempts"}</span>
      </div>
    </div>
  );
}

function displayActivitySeries(series: DashboardAnalytics["activitySeries"], range: DashboardRange) {
  if (range === "7d") return series;
  return series.slice(-30);
}

function currentModuleProgress(modules: ModuleProgress[]) {
  return modules.find((module) => module.status === "In Progress")
    ?? modules.find((module) => module.status === "Available")
    ?? modules.find((module) => module.status === "Locked")
    ?? modules.at(-1);
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
  if (!analytics.recentActivity.length) return <p className="text-sm leading-6 text-slate-400">No recent SQL activity yet. Run a query in a lesson or practice session and it will appear here.</p>;
  return (
    <div className="divide-y divide-line rounded-lg border border-line bg-panel">
      {analytics.recentActivity.map((activity) => (
        <Link className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-brand/5" href={`/challenge/${activity.challengeId}`} key={`${activity.challengeId}-${activity.attemptedAt}`}>
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

function rangeLabel(range: DashboardRange) {
  if (range === "7d") return "Last 7 Days";
  if (range === "30d") return "Last 30 Days";
  if (range === "90d") return "Last 90 Days";
  return "All Activity";
}
