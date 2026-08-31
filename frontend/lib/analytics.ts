import type { User } from "@supabase/supabase-js";
import type { Challenge } from "@/lib/api";
import {
  buildModuleProgress,
  deriveSkillMastery,
  findLessonForChallenge,
  lessonUrl,
  nextLesson,
  readinessScore,
  type CourseDefinition,
  type SkillMastery,
} from "@/lib/course";
import type { ProgressRow } from "@/lib/progress";
import { supabase } from "@/lib/supabase";

export type DashboardRange = "7d" | "30d" | "90d" | "all";

export type ChallengeAttempt = {
  id?: string;
  user_id: string;
  challenge_id: number;
  query_text?: string | null;
  is_correct: boolean;
  execution_time_ms?: number | null;
  attempted_at: string;
};

export type ActivityPoint = {
  label: string;
  dateKey: string;
  attempts: number;
  correct: number;
};

export type AccuracyPoint = {
  label: string;
  attempts: number;
  accuracy: number;
};

export type SkillInsight = SkillMastery & {
  practiceHref: string;
  attempts: number;
  correctAttempts: number;
};

export type CareerReadinessArea = {
  label: string;
  score: number;
  skills: string[];
};

export type RecentActivity = {
  challengeId: number;
  title: string;
  isCorrect: boolean;
  attemptedAt: string;
};

export type DashboardAnalytics = {
  summary: {
    readiness: number;
    courseProgress: number;
    completedLessons: number;
    totalLessons: number;
    completedQuestions: number;
    totalQuestions: number;
    attemptedQueries: number;
    solvedChallenges: number;
    currentStreak: number;
    longestStreak: number;
    accuracy: number | null;
    correctAttempts: number;
    totalAttempts: number;
  };
  problemSolving: {
    firstTryAccuracy: number | null;
    firstTryCorrect: number;
    firstTryTotal: number;
    averageAttemptsToSolve: number | null;
  };
  activitySeries: ActivityPoint[];
  accuracyTrend: AccuracyPoint[];
  skillMastery: SkillInsight[];
  strongestSkills: SkillInsight[];
  focusAreas: SkillInsight[];
  careerReadiness: CareerReadinessArea[];
  recentActivity: RecentActivity[];
};

export async function getChallengeAttempts(user: User): Promise<ChallengeAttempt[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("challenge_attempts")
    .select("id,user_id,challenge_id,query_text,is_correct,execution_time_ms,attempted_at")
    .eq("user_id", user.id)
    .order("attempted_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.warn("Could not load challenge attempts for analytics.", error);
    return [];
  }

  return (data ?? []) as ChallengeAttempt[];
}

export function buildDashboardAnalytics(
  course: CourseDefinition,
  progressRows: ProgressRow[],
  challenges: Challenge[],
  attempts: ChallengeAttempt[],
  range: DashboardRange,
): DashboardAnalytics {
  const rangeAttempts = filterAttemptsByRange(attempts, range);
  const correctRangeAttempts = rangeAttempts.filter((attempt) => attempt.is_correct).length;
  const completedRows = progressRows.filter((row) => row.status === "completed");
  const moduleProgress = buildModuleProgress(course, progressRows);
  const totalQuestions = moduleProgress.reduce((sum, module) => sum + module.totalQuestions, 0);
  const completedQuestions = moduleProgress.reduce((sum, module) => sum + module.completedQuestions, 0);
  const completedChallengeIds = new Set(completedRows.map((row) => row.challenge_id));
  const firstTry = firstTryAccuracy(attempts);
  const solvedAttempts = completedRows.map((row) => row.attempt_count).filter((count) => count > 0);
  const skillMastery = buildSkillInsights(course, progressRows, challenges, attempts);

  return {
    summary: {
      readiness: readinessScore(course, progressRows),
      courseProgress: totalQuestions ? Math.round((completedQuestions / totalQuestions) * 100) : 0,
      completedLessons: completedQuestions,
      totalLessons: totalQuestions,
      completedQuestions,
      totalQuestions,
      attemptedQueries: attempts.length,
      solvedChallenges: completedChallengeIds.size,
      currentStreak: currentActivityStreak(attempts),
      longestStreak: longestActivityStreak(attempts),
      accuracy: rangeAttempts.length ? Math.round((correctRangeAttempts / rangeAttempts.length) * 100) : null,
      correctAttempts: correctRangeAttempts,
      totalAttempts: rangeAttempts.length,
    },
    problemSolving: {
      firstTryAccuracy: firstTry.total ? Math.round((firstTry.correct / firstTry.total) * 100) : null,
      firstTryCorrect: firstTry.correct,
      firstTryTotal: firstTry.total,
      averageAttemptsToSolve: solvedAttempts.length ? roundToOne(solvedAttempts.reduce((sum, count) => sum + count, 0) / solvedAttempts.length) : null,
    },
    activitySeries: buildActivitySeries(rangeAttempts, range),
    accuracyTrend: buildAccuracyTrend(rangeAttempts),
    skillMastery,
    strongestSkills: skillMastery.filter((skill) => skill.mastery > 0).sort((a, b) => b.mastery - a.mastery).slice(0, 4),
    focusAreas: skillMastery.slice().sort((a, b) => a.mastery - b.mastery).slice(0, 4),
    careerReadiness: buildCareerReadiness(course, skillMastery),
    recentActivity: attempts.slice(0, 8).map((attempt) => {
      const challenge = challenges.find((candidate) => candidate.id === attempt.challenge_id);
      return {
        challengeId: attempt.challenge_id,
        title: challenge?.title ?? `Challenge ${attempt.challenge_id}`,
        isCorrect: attempt.is_correct,
        attemptedAt: attempt.attempted_at,
      };
    }),
  };
}

export function currentActivityStreak(attempts: Pick<ChallengeAttempt, "attempted_at">[], today = new Date()) {
  const dateKeys = new Set(attempts.map((attempt) => dateKey(attempt.attempted_at)));
  if (!dateKeys.size) return 0;

  const todayKey = dateKey(today);
  const yesterday = addDays(startOfLocalDay(today), -1);
  let cursor = dateKeys.has(todayKey) ? startOfLocalDay(today) : dateKeys.has(dateKey(yesterday)) ? yesterday : null;
  if (!cursor) return 0;

  let streak = 0;
  while (dateKeys.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestActivityStreak(attempts: Pick<ChallengeAttempt, "attempted_at">[]) {
  const keys = Array.from(new Set(attempts.map((attempt) => dateKey(attempt.attempted_at)))).sort();
  if (!keys.length) return 0;

  let longest = 1;
  let current = 1;
  for (let index = 1; index < keys.length; index += 1) {
    const previous = parseDateKey(keys[index - 1]);
    const next = parseDateKey(keys[index]);
    if (dateKey(addDays(previous, 1)) === dateKey(next)) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

function buildSkillInsights(course: CourseDefinition, progressRows: ProgressRow[], challenges: Challenge[], attempts: ChallengeAttempt[]): SkillInsight[] {
  return deriveSkillMastery(course, progressRows).map((skill) => {
    const lesson = findPracticeLesson(course, progressRows, skill.skill);
    const challengeIds = challengesForSkill(course, skill.skill);
    const skillAttempts = attempts.filter((attempt) => challengeIds.has(attempt.challenge_id));
    return {
      ...skill,
      attempts: skillAttempts.length,
      correctAttempts: skillAttempts.filter((attempt) => attempt.is_correct).length,
      practiceHref: lesson ? lessonUrl(lesson) : lessonUrl(nextLesson(course, progressRows) ?? course.modules[0].lessons[0]),
    };
  });
}

function buildCareerReadiness(course: CourseDefinition, skillInsights: SkillInsight[]): CareerReadinessArea[] {
  const areas = [
    { label: "SQL Foundations", skills: ["database-fundamentals", "select", "columns", "filtering", "where", "and-or", "order-by", "top-limit"] },
    { label: "Summarizing Data", skills: ["count", "aggregation", "group-by", "sum", "avg"] },
    { label: "Joining Tables", skills: ["inner-join", "table-relationships", "joins", "grain"] },
    { label: "Business Logic", skills: ["case", "business-logic", "conditional-aggregation", "kpi-analysis", "dates"] },
    { label: "Real SQL Work", skills: ["stakeholder-requests", "target-analysis", "investigation", "reporting"] },
  ];

  return areas.map((area) => {
    const scores = skillInsights.filter((skill) => area.skills.includes(skill.skill)).map((skill) => skill.mastery);
    return {
      ...area,
      score: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0,
    };
  });
}

function findPracticeLesson(course: CourseDefinition, progressRows: ProgressRow[], skill: string) {
  const completed = new Set(progressRows.filter((row) => row.status === "completed").map((row) => row.challenge_id));
  const lessons = course.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.skills.includes(skill));
  return lessons.find((lesson) => !completed.has(lesson.challengeId)) ?? lessons[0] ?? nextLesson(course, progressRows);
}

function challengesForSkill(course: CourseDefinition, skill: string) {
  const ids = new Set<number>();
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      if (lesson.skills.includes(skill)) {
        const direct = findLessonForChallenge(course, lesson.challengeId);
        if (direct) ids.add(lesson.challengeId);
        for (const stage of lesson.stages ?? []) {
          if (typeof stage.challengeId === "number") ids.add(stage.challengeId);
        }
      }
    }
  }
  return ids;
}

function firstTryAccuracy(attempts: ChallengeAttempt[]) {
  const earliestByChallenge = new Map<number, ChallengeAttempt>();
  for (const attempt of attempts.slice().sort((a, b) => Date.parse(a.attempted_at) - Date.parse(b.attempted_at))) {
    if (!earliestByChallenge.has(attempt.challenge_id)) earliestByChallenge.set(attempt.challenge_id, attempt);
  }
  const firstAttempts = Array.from(earliestByChallenge.values());
  return {
    correct: firstAttempts.filter((attempt) => attempt.is_correct).length,
    total: firstAttempts.length,
  };
}

function filterAttemptsByRange(attempts: ChallengeAttempt[], range: DashboardRange) {
  const start = rangeStart(range);
  if (!start) return attempts;
  return attempts.filter((attempt) => Date.parse(attempt.attempted_at) >= start.getTime());
}

function rangeStart(range: DashboardRange) {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : null;
  if (!days) return null;
  return addDays(startOfLocalDay(new Date()), -(days - 1));
}

function buildActivitySeries(attempts: ChallengeAttempt[], range: DashboardRange): ActivityPoint[] {
  const byDate = new Map<string, ActivityPoint>();
  const start = rangeStart(range);

  if (start && range !== "all") {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    for (let index = 0; index < days; index += 1) {
      const day = addDays(start, index);
      const key = dateKey(day);
      byDate.set(key, { label: shortDateLabel(day), dateKey: key, attempts: 0, correct: 0 });
    }
  }

  for (const attempt of attempts) {
    const key = dateKey(attempt.attempted_at);
    const existing = byDate.get(key) ?? { label: shortDateLabel(parseDateKey(key)), dateKey: key, attempts: 0, correct: 0 };
    existing.attempts += 1;
    if (attempt.is_correct) existing.correct += 1;
    byDate.set(key, existing);
  }

  return Array.from(byDate.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

function buildAccuracyTrend(attempts: ChallengeAttempt[]): AccuracyPoint[] {
  const buckets = new Map<string, { correct: number; attempts: number; label: string }>();
  for (const attempt of attempts) {
    const day = parseDateKey(dateKey(attempt.attempted_at));
    const weekStart = addDays(day, -day.getDay());
    const key = dateKey(weekStart);
    const existing = buckets.get(key) ?? { correct: 0, attempts: 0, label: shortDateLabel(weekStart) };
    existing.attempts += 1;
    if (attempt.is_correct) existing.correct += 1;
    buckets.set(key, existing);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, bucket]) => ({
      label: bucket.label,
      attempts: bucket.attempts,
      accuracy: Math.round((bucket.correct / bucket.attempts) * 100),
    }));
}

function dateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function shortDateLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function roundToOne(value: number) {
  return Math.round(value * 10) / 10;
}
