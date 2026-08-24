import type { Challenge } from "@/lib/api";

export const LEARNING_MODES = [
  {
    id: "completely-new",
    label: "Completely New",
    description: "Start from zero and build SQL fundamentals step by step.",
  },
  {
    id: "know-the-basics",
    label: "Know the Basics",
    description: "You know basic SELECT and filtering. Build confidence with practical SQL.",
  },
  {
    id: "comfortable-with-sql",
    label: "Comfortable With SQL",
    description: "You can write everyday SQL and want to tackle more complex problems.",
  },
  {
    id: "expert-study",
    label: "Expert Study Mode",
    description: "Deep practice for experienced SQL users who want advanced challenges and stronger problem-solving skills.",
  },
  {
    id: "quick-interview-prep",
    label: "Quick Interview Prep",
    description: "Practice common SQL interview questions without completing a full course.",
  },
] as const;

export type LearningMode = (typeof LEARNING_MODES)[number];
export type LearningModeId = LearningMode["id"];

const learningModeIds = new Set<string>(LEARNING_MODES.map((mode) => mode.id));
const learningModeMap = new Map<string, LearningMode>(LEARNING_MODES.map((mode) => [mode.id, mode]));

const legacyModeMap: Record<string, LearningModeId> = {
  "Completely New": "completely-new",
  "Know the Basics": "know-the-basics",
  "Comfortable With SQL": "comfortable-with-sql",
  "Interview Preparation": "quick-interview-prep",
  "Expert Study Mode": "expert-study",
  "Quick Interview Prep": "quick-interview-prep",
};

export function normalizeLearningModeId(value: unknown): LearningModeId {
  if (typeof value === "string") {
    if (learningModeIds.has(value)) return value as LearningModeId;
    const legacyMode = legacyModeMap[value];
    if (legacyMode) return legacyMode;
  }
  return "completely-new";
}

export function getLearningMode(value: unknown): LearningMode {
  return learningModeMap.get(normalizeLearningModeId(value)) ?? LEARNING_MODES[0];
}

export function learningModeLabel(value: unknown): string {
  return getLearningMode(value).label;
}

export const challengeGroups = [
  { title: "Beginner Foundations", ids: [1, 2, 3, 4] },
  { title: "Beginner Reporting", ids: [5, 6, 7, 8] },
  { title: "Intermediate Analysis", ids: [9, 10, 11, 12, 13] },
  { title: "Advanced Business Questions", ids: [14, 15] },
  { title: "Analytics Foundations", ids: [16, 17, 18] },
  { title: "Analytics Practice", ids: [19, 20, 21, 23] },
  { title: "Advanced Projects", ids: [22, 24, 25] },
];

export function skillForChallenge(challenge: Challenge) {
  if (challenge.id === 1) return "SELECT";
  if (challenge.id === 2) return "Column Selection";
  if (challenge.id === 3) return "WHERE";
  if (challenge.id === 4) return "AND Conditions";
  if (challenge.id === 5) return "ORDER BY";
  if (challenge.id === 6) return "TOP";
  if (challenge.id === 7) return "COUNT";
  if (challenge.id === 8) return "GROUP BY";
  if (challenge.id === 9) return "SUM / AVG";
  if (challenge.id === 10) return "INNER JOIN";
  if (challenge.id === 11) return "JOIN + GROUP BY";
  if (challenge.id === 12) return "CASE";
  if (challenge.id === 13) return "Date Filtering";
  if (challenge.id === 14) return "Ranked Aggregates";
  if (challenge.id === 15) return "Business Analysis";
  if (challenge.id === 16) return "Analytical SELECT";
  if (challenge.id === 17) return "Account Aggregation";
  if (challenge.id === 18) return "Transaction Filtering";
  if (challenge.id === 19) return "Trend Analysis";
  if (challenge.id === 20) return "Customer Segmentation";
  if (challenge.id === 21) return "KPI Analysis";
  if (challenge.id === 22) return "Funnel Analysis";
  if (challenge.id === 23) return "Product Adoption";
  if (challenge.id === 24) return "Target Analysis";
  return "Analytical Investigation";
}

export function nextUnfinishedChallenge(challenges: Challenge[], completedIds: Set<number>) {
  return challenges.find((challenge) => !completedIds.has(challenge.id)) ?? challenges[0];
}
