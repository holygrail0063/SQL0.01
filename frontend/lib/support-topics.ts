export const SUPPORT_TOPICS = [
  "Account & Login",
  "Learning & Courses",
  "SQL Editor",
  "Query Results / Validation",
  "Progress & Statistics",
  "Technical Issue",
  "Feedback / Feature Request",
  "Other",
] as const;

export type SupportTopic = (typeof SUPPORT_TOPICS)[number];

export function isSupportTopic(value: unknown): value is SupportTopic {
  return typeof value === "string" && SUPPORT_TOPICS.includes(value as SupportTopic);
}
