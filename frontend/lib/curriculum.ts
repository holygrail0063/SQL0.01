import type { Challenge } from "@/lib/api";

export const roleOptions = [
  "Business Analyst",
  "Data Analyst",
  "Data Scientist",
  "Data Engineer",
  "BI Analyst",
  "Product Analyst",
  "Financial / Risk Analyst",
  "Backend Developer",
  "Just learning SQL",
];

export const sqlLevelOptions = [
  {
    value: "Completely New",
    description: "I've barely used SQL or I'm starting from scratch.",
  },
  {
    value: "Know the Basics",
    description: "I'm familiar with SELECT, WHERE, and simple queries.",
  },
  {
    value: "Comfortable With SQL",
    description: "I've worked with joins, aggregations, and more complex queries.",
  },
  {
    value: "Interview Preparation",
    description: "I'm mainly preparing for SQL interviews or job assessments.",
  },
];

export const challengeGroups = [
  { title: "Beginner Foundations", ids: [1, 2, 3, 4] },
  { title: "Beginner Reporting", ids: [5, 6, 7, 8] },
  { title: "Intermediate Analysis", ids: [9, 10, 11, 12, 13] },
  { title: "Advanced Business Questions", ids: [14, 15] },
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
  return "Business Analysis";
}

export function nextUnfinishedChallenge(challenges: Challenge[], completedIds: Set<number>) {
  return challenges.find((challenge) => !completedIds.has(challenge.id)) ?? challenges[0];
}
