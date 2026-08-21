import type { Challenge } from "@/lib/api";
import type { Profile, ProgressRow } from "@/lib/progress";

export const dailyCommitmentOptions = [15, 30, 45, 60] as const;

export type DailyCommitment = (typeof dailyCommitmentOptions)[number];
export type ExperienceLevel = "Completely New" | "Know the Basics" | "Comfortable With SQL" | "Interview Preparation";
export type LessonType = "concept" | "exercise" | "assignment" | "review" | "interview" | "project";

export type CourseDefinition = {
  id: string;
  learningGoal: "Business Analyst";
  experienceLevel: ExperienceLevel;
  title: string;
  shortTitle: string;
  description: string;
  estimatedWeeks: string;
  lessonCountLabel: string;
  exerciseCountLabel: string;
  projectCountLabel: string;
  capstoneCountLabel: string;
  difficulty: string;
  skills: string[];
  modules: ModuleDefinition[];
};

export type ModuleDefinition = {
  id: string;
  sequence: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  prerequisiteSkills: string[];
  lessons: LessonDefinition[];
};

export type LessonDefinition = {
  id: string;
  moduleId: string;
  sequence: number;
  challengeId: number;
  title: string;
  type: LessonType;
  estimatedMinutes: number;
  difficulty: string;
  skills: string[];
  businessContext: string;
  concept: string;
  guidedPrompt: string;
  independentPrompt: string;
  interpretationPrompt: string;
  hints: string[];
};

export type SkillMastery = {
  skill: string;
  mastery: number;
};

export type ModuleProgress = {
  module: ModuleDefinition;
  completedLessons: number;
  totalLessons: number;
  status: "Completed" | "In Progress" | "Available" | "Locked";
  percent: number;
};

const foundationSkills = [
  "Database Fundamentals",
  "SELECT",
  "DISTINCT",
  "Aliases",
  "Filtering",
  "AND / OR",
  "IN",
  "BETWEEN",
  "LIKE",
  "NULL",
  "ORDER BY",
  "Aggregate Functions",
  "GROUP BY",
  "HAVING",
  "CASE",
  "INNER JOIN",
  "LEFT JOIN",
  "Multi-table JOIN",
  "Subqueries",
  "CTEs",
  "Date Functions",
  "String Functions",
  "Data Type Conversion",
  "Window Functions",
  "ROW_NUMBER",
  "RANK",
  "LAG / LEAD",
  "Conditional Aggregation",
  "KPI Analysis",
  "Data Validation",
  "Reconciliation",
  "Requirement Validation",
  "UAT Validation",
  "Root Cause Analysis",
  "Trend Analysis",
  "Operational Reporting",
  "Data Quality Investigation",
  "Stakeholder Request Interpretation",
];

const baseLessons: LessonDefinition[] = [
  lesson("ba-new-m0", 1, "Understanding Business Tables", "concept", 8, "Beginner", ["Database Fundamentals", "SELECT"], "Your team lead asks for a complete customer extract so you can understand what columns SQLBank stores.", "A table is a structured list of records. SELECT chooses what to show, and FROM names the table you are reading from.", "Start with a full table extract so you can inspect the shape of the customer data.", "Your manager needs every customer record available for a data inventory.", "What do the rows represent, and why might a BA inspect all columns before narrowing the query?", ["Start with SELECT.", "Use the Customers table.", "A full extract uses SELECT * FROM Customers."]),
  lesson("ba-new-m0", 2, "Choosing Business Columns", "exercise", 8, "Beginner", ["SELECT", "Aliases", "Operational Reporting"], "A stakeholder only needs customer names and locations, not every column in the customer table.", "Business reports should usually select only useful columns. This makes the output easier to read and safer to share.", "Return only the customer identity and location fields.", "Create a customer contact extract with customer ID, first name, last name, province, and city.", "Which columns would you exclude before sending this to a business user?", ["Name the columns after SELECT.", "Separate columns with commas.", "Use FROM Customers after the column list."]),
  lesson("ba-new-m1", 3, "Filtering to One Province", "exercise", 9, "Beginner", ["Filtering", "WHERE", "Stakeholder Request Interpretation"], "Branch operations only wants Ontario customers for a local campaign check.", "WHERE keeps only the rows that match a condition. It is the first tool for turning a broad table into a business answer.", "Use WHERE to keep only Ontario records.", "Return every customer who lives in Ontario.", "What business question does the Province filter answer?", ["You need to reduce rows.", "Look at the Province column.", "Use WHERE Province = 'Ontario'."]),
  lesson("ba-new-m1", 4, "Combining Conditions", "exercise", 10, "Beginner", ["Filtering", "AND / OR", "Requirement Validation"], "A requirements analyst needs Toronto customers in Ontario to validate a city-specific rule.", "AND requires both conditions to be true. This is how a BA turns multiple requirements into one query.", "Filter by province and city.", "Return customers where Province is Ontario and City is Toronto.", "If the result is smaller than the Ontario-only list, what does that tell you?", ["Use two conditions.", "Both conditions must be true.", "Use WHERE Province = 'Ontario' AND City = 'Toronto'."]),
  lesson("ba-new-m1", 5, "Sorting Business Output", "exercise", 8, "Beginner", ["ORDER BY", "Operational Reporting"], "Customer service wants recent customers first while reviewing onboarding activity.", "ORDER BY changes result order without changing which rows are returned.", "Sort by the date the customer joined.", "Return customers ordered by CustomerSince with newest customers first.", "Why is sorting important when a human is reviewing the result?", ["You need ordering, not filtering.", "Use CustomerSince.", "Newest first means DESC."]),
  lesson("ba-new-m2", 6, "Limiting Review Samples", "review", 7, "Beginner", ["TOP", "Operational Reporting"], "Your manager wants a quick sample before approving a larger report extract.", "TOP limits the number of returned rows. It is useful for quick inspection, especially before running larger reports.", "Return a small sample from Customers.", "Show the first 10 customer records from SQLBank.", "Why might a BA sample data before building a full report?", ["Use TOP after SELECT.", "Keep the Customers table.", "Ask for 10 rows."]),
  lesson("ba-new-m2", 7, "Counting Records", "exercise", 8, "Beginner", ["Aggregate Functions", "COUNT", "KPI Analysis"], "A dashboard owner asks how many loan applications exist in the training dataset.", "COUNT summarizes rows into a number. Business users often ask for counts before asking for detailed records.", "Count all application records.", "Return the total number of records in Applications.", "What does the count measure, and what does it not tell you?", ["Use COUNT(*).", "The table is Applications.", "This returns one row with one value."]),
  lesson("ba-new-m2", 8, "Grouping by Business Category", "assignment", 12, "Beginner", ["GROUP BY", "KPI Analysis", "Operational Reporting"], "Lending leadership wants application volume by status to understand the pipeline.", "GROUP BY creates one summary row per category. It turns raw records into a report.", "Count applications for each status.", "Return each application Status and the number of applications in that status.", "Which status needs the most operational attention?", ["Status is the category.", "COUNT(*) is the metric.", "GROUP BY Status."]),
  lesson("ba-new-m3", 9, "Summarizing Loan Amounts", "exercise", 10, "Intermediate", ["SUM", "AVG", "KPI Analysis"], "Finance wants total and average loan exposure for active reporting.", "SUM and AVG calculate business measures. They are often used together to understand total size and typical size.", "Calculate loan totals and averages.", "Return total loan amount and average loan amount from Loans.", "How would total exposure and average exposure be used differently?", ["Use SUM on LoanAmount.", "Use AVG on LoanAmount.", "Both come from Loans."]),
  lesson("ba-new-m3", 10, "Connecting Applications to Branches", "assignment", 14, "Intermediate", ["INNER JOIN", "Multi-table JOIN", "Operational Reporting"], "The branch manager needs application records with branch names instead of branch IDs.", "JOIN combines related tables. Business users usually need descriptive fields from lookup tables, not just IDs.", "Join Applications to Branches.", "Return application ID, branch name, requested amount, and status.", "Why is BranchName more useful than BranchID in a stakeholder report?", ["Applications has BranchID.", "Branches also has BranchID.", "Join on matching BranchID values."]),
  lesson("ba-new-m3", 11, "Branch Volume Report", "assignment", 15, "Intermediate", ["INNER JOIN", "GROUP BY", "KPI Analysis"], "A regional director wants to compare application volume by branch.", "JOIN plus GROUP BY is a core BA pattern: connect descriptive data, then summarize it.", "Count applications by branch.", "Return each BranchName and its application count.", "Which branch appears busiest, and what follow-up question would you ask?", ["Start from Applications.", "Join Branches for BranchName.", "Group by BranchName."]),
  lesson("ba-new-m4", 12, "Turning Rows into Business Flags", "exercise", 12, "Intermediate", ["CASE", "Conditional Aggregation", "Requirement Validation"], "Risk operations wants requested loan amounts labeled into review bands.", "CASE creates business labels from data. It is useful when requirements define categories that are not already stored in the table.", "Create a label based on RequestedAmount.", "Return ApplicationID, RequestedAmount, and a size band for each application.", "How could a BA validate that the bands match the written requirement?", ["CASE belongs in SELECT.", "Use RequestedAmount thresholds.", "Name the calculated label clearly."]),
  lesson("ba-new-m5", 13, "Filtering a Date Window", "assignment", 12, "Intermediate", ["Date Functions", "BETWEEN", "Operational Reporting"], "Operations needs January 2025 applications for a monthly control check.", "Date filters turn open-ended data into a reporting period. BAs use them constantly for monthly reports and UAT windows.", "Filter applications to a month.", "Return applications submitted in January 2025.", "What does this result prove about the reporting period?", ["Use ApplicationDate.", "A month is a range.", "Use dates from 2025-01-01 through 2025-01-31."]),
  lesson("ba-new-m6", 14, "Ranking Branches by Loan Value", "assignment", 15, "Advanced", ["ORDER BY", "Aggregate Functions", "KPI Analysis"], "Executives want to know which branches hold the highest total loan value.", "Ranking helps prioritize business review. Sort the most important summary rows first.", "Calculate total loan amount by branch, then sort.", "Return the top branches by total loan amount.", "Which branch would you investigate first and why?", ["Join Loans to Branches.", "SUM LoanAmount.", "Order the total descending."]),
  lesson("ba-new-m6", 15, "Branch Approval Rate Capstone", "project", 20, "Advanced", ["CASE", "Conditional Aggregation", "KPI Analysis", "Root Cause Analysis"], "Your manager is preparing an executive update and needs the five branches with the highest application approval rate.", "Approval rate is a KPI: approved applications divided by total applications. This capstone combines joining, grouping, CASE, calculation, and ranking.", "Calculate approved applications divided by total applications.", "Return BranchName and ApprovalRate for the five highest approval-rate branches.", "What does a high approval rate suggest, and what might you validate before acting on it?", ["You need all applications as the denominator.", "Use CASE to count approved rows.", "Divide approved count by total count and order the result."]),
];

export const interviewQuestions = Array.from({ length: 40 }, (_, index) => {
  const topics = ["Filtering", "Aggregations", "JOINs", "CASE", "Debugging", "Business Analyst"];
  const topic = topics[index % topics.length];
  return {
    id: `ba-interview-${index + 1}`,
    category: topic,
    difficulty: index < 14 ? "Easy" : index < 30 ? "Medium" : "Hard",
    question: `${topic} interview scenario ${index + 1}: explain how you would use SQL to answer a stakeholder request without guessing from incomplete requirements.`,
    keyPoints: ["Clarify the business question.", "Identify the right table and grain.", "Write SQL that validates the requested logic.", "Explain the result in business language."],
  };
});

const courses: CourseDefinition[] = [
  course("ba-completely-new", "Completely New", "Business Analyst SQL Path", "Business Analyst - Completely New", "Learn SQL from the beginning while working through realistic SQLBank Business Analyst assignments.", "10-12 weeks", "~65 lessons", "120+ exercises", "6 projects", "1 capstone", "Beginner to Workplace SQL", baseLessons),
  course("ba-know-basics", "Know the Basics", "Business Analyst SQL Acceleration Path", "Business Analyst - Know the Basics", "Review the essentials quickly, then build confidence solving real SQLBank business requests.", "6-8 weeks", "~40 lessons", "80+ exercises", "4 projects", "1 capstone", "Fundamentals to Applied Analysis", baseLessons.filter((lesson) => lesson.challengeId >= 3)),
  course("ba-comfortable", "Comfortable With SQL", "Advanced Business Analyst SQL Path", "Business Analyst - Comfortable With SQL", "Skip basic syntax review and focus on analysis, joins, KPIs, validation, and investigations.", "4-6 weeks", "~30 lessons", "60+ exercises", "3 projects", "1 capstone", "Intermediate to Advanced BA SQL", baseLessons.filter((lesson) => lesson.challengeId >= 9)),
  course("ba-interview", "Interview Preparation", "Business Analyst SQL Interview Path", "Business Analyst - Interview Preparation", "Practice SQL explanations, timed query writing, debugging, and Business Analyst scenario questions.", "2-4 weeks", "40 questions + 15 coding drills", "Timed practice sets", "Mock interview flow", "1 readiness review", "Interview Readiness", baseLessons.filter((lesson) => [3, 7, 8, 10, 12, 15].includes(lesson.challengeId)).map((lesson) => ({ ...lesson, type: "interview" as const }))),
];

export function getBusinessAnalystCourse(experienceLevel?: string | null) {
  return courses.find((course) => course.experienceLevel === experienceLevel) ?? courses[0];
}

export function getCourseForProfile(profile: Pick<Profile, "selected_role" | "sql_level"> | null) {
  if (!profile?.selected_role) return getBusinessAnalystCourse("Completely New");
  if (profile.selected_role !== "Business Analyst") return null;
  return getBusinessAnalystCourse(profile.sql_level);
}

export function getDailyCommitment(profile: Pick<Profile, "daily_commitment_minutes"> | null | undefined): DailyCommitment {
  const value = profile?.daily_commitment_minutes;
  return dailyCommitmentOptions.includes(value as DailyCommitment) ? (value as DailyCommitment) : 30;
}

export function allBusinessAnalystCourses() {
  return courses;
}

export function getLessonById(lessonId: string) {
  for (const courseDefinition of courses) {
    for (const module of courseDefinition.modules) {
      const lesson = module.lessons.find((candidate) => candidate.id === lessonId);
      if (lesson) return { course: courseDefinition, module, lesson };
    }
  }
  return null;
}

export function findLessonForChallenge(courseDefinition: CourseDefinition, challengeId: number) {
  return courseDefinition.modules.flatMap((module) => module.lessons).find((lesson) => lesson.challengeId === challengeId);
}

export function nextLesson(courseDefinition: CourseDefinition, progressRows: ProgressRow[]) {
  const completed = completedChallengeIds(progressRows);
  return courseDefinition.modules.flatMap((module) => module.lessons).find((lesson) => !completed.has(lesson.challengeId)) ?? courseDefinition.modules[0]?.lessons[0] ?? null;
}

export function buildModuleProgress(courseDefinition: CourseDefinition, progressRows: ProgressRow[]): ModuleProgress[] {
  const completed = completedChallengeIds(progressRows);
  let previousComplete = true;

  return courseDefinition.modules.map((module, index) => {
    const completedLessons = module.lessons.filter((lesson) => completed.has(lesson.challengeId)).length;
    const totalLessons = module.lessons.length;
    const percent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const status: ModuleProgress["status"] =
      completedLessons === totalLessons ? "Completed" : completedLessons > 0 ? "In Progress" : previousComplete || index === 0 ? "Available" : "Locked";
    previousComplete = status === "Completed";
    return { module, completedLessons, totalLessons, status, percent };
  });
}

export function deriveSkillMastery(courseDefinition: CourseDefinition, progressRows: ProgressRow[]): SkillMastery[] {
  const byChallenge = new Map(progressRows.map((row) => [row.challenge_id, row]));
  const lessonScores = new Map<string, number[]>();

  for (const module of courseDefinition.modules) {
    for (const lessonDefinition of module.lessons) {
      const progress = byChallenge.get(lessonDefinition.challengeId);
      const base = progress?.status === "completed" ? 78 : progress?.status === "in_progress" ? 32 : 0;
      const attemptPenalty = Math.max(0, (progress?.attempt_count ?? 0) - 1) * 5;
      const score = Math.max(0, Math.min(100, base - attemptPenalty + (lessonDefinition.type === "project" && progress?.status === "completed" ? 8 : 0)));
      for (const skill of lessonDefinition.skills) {
        const scores = lessonScores.get(skill) ?? [];
        scores.push(score);
        lessonScores.set(skill, scores);
      }
    }
  }

  return courseDefinition.skills.slice(0, 18).map((skill) => {
    const scores = lessonScores.get(skill) ?? [];
    const mastery = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    return { skill, mastery };
  });
}

export function courseCompletionPercent(courseDefinition: CourseDefinition, progressRows: ProgressRow[]) {
  const lessons = courseDefinition.modules.flatMap((module) => module.lessons);
  if (!lessons.length) return 0;
  const completed = completedChallengeIds(progressRows);
  return Math.round((lessons.filter((lesson) => completed.has(lesson.challengeId)).length / lessons.length) * 100);
}

export function readinessScore(courseDefinition: CourseDefinition, progressRows: ProgressRow[]) {
  const mastery = deriveSkillMastery(courseDefinition, progressRows);
  if (!mastery.length) return 0;
  const core = mastery.filter((item) => ["SELECT", "Filtering", "Aggregate Functions", "GROUP BY", "INNER JOIN", "CASE"].includes(item.skill));
  const ba = mastery.filter((item) => item.skill.includes("Analysis") || item.skill.includes("Validation") || item.skill.includes("Reporting") || item.skill.includes("Interpretation"));
  const coreAverage = average(core.map((item) => item.mastery));
  const baAverage = average(ba.map((item) => item.mastery));
  return Math.round(coreAverage * 0.65 + baAverage * 0.35);
}

export function weeklyProgress(progressRows: ProgressRow[]) {
  const attempts = progressRows.reduce((sum, row) => sum + row.attempt_count, 0);
  const completed = progressRows.filter((row) => row.status === "completed").length;
  return {
    lessonsCompleted: completed,
    exercisesSolved: completed,
    minutesPracticed: attempts * 8,
    currentStreak: completed > 0 ? Math.min(7, completed) : 0,
    assignments: completed,
  };
}

export function reviewDue(courseDefinition: CourseDefinition, progressRows: ProgressRow[]) {
  const mastery = deriveSkillMastery(courseDefinition, progressRows);
  const due = mastery.filter((item) => item.mastery > 0 && item.mastery < 70).slice(0, 3);
  return due.length ? due : mastery.filter((item) => item.mastery === 0).slice(0, 3);
}

export function lessonUrl(lesson: LessonDefinition) {
  return `/learn/lesson/${lesson.id}`;
}

export function challengeForLesson(lesson: LessonDefinition, challenges: Challenge[]) {
  return challenges.find((challenge) => challenge.id === lesson.challengeId);
}

function course(
  id: string,
  experienceLevel: ExperienceLevel,
  title: string,
  shortTitle: string,
  description: string,
  estimatedWeeks: string,
  lessonCountLabel: string,
  exerciseCountLabel: string,
  projectCountLabel: string,
  capstoneCountLabel: string,
  difficulty: string,
  lessons: LessonDefinition[],
): CourseDefinition {
  const modules = groupModules(lessons);
  return {
    id,
    learningGoal: "Business Analyst",
    experienceLevel,
    title,
    shortTitle,
    description,
    estimatedWeeks,
    lessonCountLabel,
    exerciseCountLabel,
    projectCountLabel,
    capstoneCountLabel,
    difficulty,
    skills: foundationSkills,
    modules,
  };
}

function groupModules(lessons: LessonDefinition[]): ModuleDefinition[] {
  const moduleCopy: Record<string, Omit<ModuleDefinition, "lessons">> = {
    "ba-new-m0": { id: "ba-new-m0", sequence: 0, title: "Understanding Business Data", description: "Learn tables, rows, columns, and the SQLBank business domain.", estimatedMinutes: 35, prerequisiteSkills: [] },
    "ba-new-m1": { id: "ba-new-m1", sequence: 1, title: "Filtering Business Records", description: "Turn stakeholder requirements into WHERE clauses and ordered outputs.", estimatedMinutes: 45, prerequisiteSkills: ["SELECT"] },
    "ba-new-m2": { id: "ba-new-m2", sequence: 2, title: "Operational Reporting Basics", description: "Use TOP, COUNT, and GROUP BY to produce simple reporting summaries.", estimatedMinutes: 50, prerequisiteSkills: ["Filtering"] },
    "ba-new-m3": { id: "ba-new-m3", sequence: 3, title: "Joining Business Data", description: "Connect applications, branches, loans, and customers for useful reporting.", estimatedMinutes: 60, prerequisiteSkills: ["GROUP BY"] },
    "ba-new-m4": { id: "ba-new-m4", sequence: 4, title: "Business Rules With CASE", description: "Translate requirement logic into clear labels and calculated outputs.", estimatedMinutes: 35, prerequisiteSkills: ["SELECT", "Filtering"] },
    "ba-new-m5": { id: "ba-new-m5", sequence: 5, title: "Period-Based Analysis", description: "Filter by business reporting windows and validate monthly extracts.", estimatedMinutes: 35, prerequisiteSkills: ["Filtering"] },
    "ba-new-m6": { id: "ba-new-m6", sequence: 6, title: "KPI Analysis and Capstone", description: "Combine joins, aggregations, conditional logic, and ranking into BA deliverables.", estimatedMinutes: 70, prerequisiteSkills: ["INNER JOIN", "GROUP BY", "CASE"] },
  };

  return Object.values(moduleCopy)
    .map((module) => ({ ...module, lessons: lessons.filter((lessonDefinition) => lessonDefinition.moduleId === module.id) }))
    .filter((module) => module.lessons.length > 0)
    .sort((a, b) => a.sequence - b.sequence);
}

function lesson(
  moduleId: string,
  challengeId: number,
  title: string,
  type: LessonType,
  estimatedMinutes: number,
  difficulty: string,
  skills: string[],
  businessContext: string,
  concept: string,
  guidedPrompt: string,
  independentPrompt: string,
  interpretationPrompt: string,
  hints: string[],
): LessonDefinition {
  return {
    id: `${moduleId}-lesson-${challengeId}`,
    moduleId,
    sequence: challengeId,
    challengeId,
    title,
    type,
    estimatedMinutes,
    difficulty,
    skills,
    businessContext,
    concept,
    guidedPrompt,
    independentPrompt,
    interpretationPrompt,
    hints,
  };
}

function completedChallengeIds(progressRows: ProgressRow[]) {
  return new Set(progressRows.filter((row) => row.status === "completed").map((row) => row.challenge_id));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
