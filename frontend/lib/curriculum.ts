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
  { title: "SQL Fundamentals", ids: [1, 2, 3, 4, 5] },
  { title: "SQL Analysis", ids: [6, 7, 8, 9] },
  { title: "SQLBank Business Challenge", ids: [10] },
];

export function skillForChallenge(challenge: Challenge) {
  if (challenge.id === 1) return "SELECT";
  if (challenge.id === 2) return "WHERE";
  if (challenge.id === 3) return "ORDER BY";
  if (challenge.id === 4) return "COUNT";
  if (challenge.id === 5) return "GROUP BY";
  if (challenge.id === 6) return "Aggregation / JOIN";
  if (challenge.id === 7) return "JOIN";
  if (challenge.id === 8) return "Multi-table JOIN";
  if (challenge.id === 9) return "CASE";
  return "Business Analysis";
}

export function nextUnfinishedChallenge(challenges: Challenge[], completedIds: Set<number>) {
  return challenges.find((challenge) => !completedIds.has(challenge.id)) ?? challenges[0];
}
