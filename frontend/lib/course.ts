import type { Challenge } from "@/lib/api";
import { isLearningModeActive, learningModeLabel, normalizeLearningModeId, type LearningModeId } from "./curriculum";
import type { Profile, ProgressRow } from "@/lib/progress";

export const dailyCommitmentOptions = [15, 30, 45, 60] as const;

export type DailyCommitment = (typeof dailyCommitmentOptions)[number];
export type ExperienceLevel = string;
export type LessonType = "concept" | "exercise" | "assignment" | "review" | "interview" | "project";
export type LessonStageType = "guided_exercise" | "independent_exercise" | "business_task" | "review";
export type AssistanceLevel = "guided" | "standard" | "light" | "minimal" | "interview";
export type DatabaseId = "sqlbank";
export type DifficultyId = "foundation" | "intermediate" | "advanced" | "expert";
export type QuestionType = "guided" | "independent" | "business" | "debugging" | "capstone" | "interview";

export type CourseDefinition = {
  id: string;
  learningModeId: LearningModeId;
  recommendedStartModuleId: string;
  experienceLevel: ExperienceLevel;
  assistanceLevel: AssistanceLevel;
  title: string;
  shortTitle: string;
  description: string;
  lessonCountLabel: string;
  questionCountLabel: string;
  moduleCountLabel: string;
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
  difficultyId: DifficultyId;
  databaseId: DatabaseId;
  skills: string[];
  businessContext: string;
  concept: string;
  guidedPrompt: string;
  independentPrompt: string;
  interpretationPrompt: string;
  hints: string[];
  stages?: LessonStageDefinition[];
};

export type LessonStageDefinition = {
  id: string;
  lessonId: string;
  sequence: number;
  type: LessonStageType;
  title: string;
  instructions: string;
  estimatedMinutes: number;
  challengeId?: number;
  starterSql?: string;
  hints: string[];
  carryForwardQuery?: boolean;
  questionType: QuestionType;
  databaseId: DatabaseId;
  difficultyId: DifficultyId;
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

export type LessonBundle = {
  course: CourseDefinition;
  module: ModuleDefinition;
  lesson: LessonDefinition;
};

export type CurriculumPosition = {
  courseIndex: number;
  moduleIndex: number;
  lessonIndex: number;
  questionIndex: number;
  questionCount: number;
  lessonCount: number;
  moduleCount: number;
  hasPreviousQuestion: boolean;
  hasNextQuestion: boolean;
  hasNextLesson: boolean;
  hasNextModule: boolean;
  isLastQuestionInLesson: boolean;
  isLastLessonInModule: boolean;
  isLastModuleInCourse: boolean;
  isFinalCourseQuestion: boolean;
  previousQuestionIndex?: number;
  nextQuestionIndex?: number;
  nextLesson?: LessonDefinition;
  nextModule?: ModuleDefinition;
  nextModuleLesson?: LessonDefinition;
};

export const LEARNING_MODE_CONFIG: Record<LearningModeId, { startModuleId: string; assistanceLevel: AssistanceLevel; playlist?: "interview" }> = {
  "completely-new": { startModuleId: "sql-foundations", assistanceLevel: "guided" },
  "know-the-basics": { startModuleId: "summarizing-data", assistanceLevel: "standard" },
  "comfortable-with-sql": { startModuleId: "joining-tables", assistanceLevel: "light" },
  "expert-study": { startModuleId: "advanced-sql", assistanceLevel: "minimal" },
  "quick-interview-prep": { startModuleId: "interview-fundamentals", assistanceLevel: "interview", playlist: "interview" },
};

const MODULES: Omit<ModuleDefinition, "lessons">[] = [
  { id: "sql-foundations", sequence: 1, title: "SQL Foundations", description: "Learn databases, tables, rows, columns, SELECT, and basic WHERE filters.", estimatedMinutes: 45, prerequisiteSkills: [] },
  { id: "filtering-sorting", sequence: 2, title: "Filtering & Sorting", description: "Narrow SQLBank data with multiple conditions, ordering, and limited result sets.", estimatedMinutes: 25, prerequisiteSkills: ["select"] },
  { id: "summarizing-data", sequence: 3, title: "Summarizing Data", description: "Turn rows into useful business metrics with COUNT, SUM, AVG, and GROUP BY.", estimatedMinutes: 30, prerequisiteSkills: ["select", "filtering"] },
  { id: "joining-tables", sequence: 4, title: "Joining Tables", description: "Connect customers, branches, applications, and loans while keeping the reporting grain clear.", estimatedMinutes: 44, prerequisiteSkills: ["group-by"] },
  { id: "business-logic", sequence: 5, title: "Business Logic", description: "Use CASE and date filters to translate business rules into SQL.", estimatedMinutes: 24, prerequisiteSkills: ["filtering", "aggregation"] },
  { id: "sqlbank-practice", sequence: 6, title: "SQLBank Practice", description: "Solve a realistic SQLBank request that combines reporting, KPIs, and investigation.", estimatedMinutes: 20, prerequisiteSkills: ["joins", "aggregation", "business-logic"] },
];

const MASTER_LESSONS: LessonDefinition[] = [
  lesson("ba-new-m0-lesson-1", "sql-foundations", 1, 1, "Understanding Tables", "concept", 8, "foundation", ["database-fundamentals", "select"], "Your team lead asks for a complete customer extract so you can understand what columns SQLBank stores.", "A table is a structured list of records. SELECT chooses what to show, and FROM names the table you are reading from.", "Your manager needs every customer record available for a data inventory.", "What does one row represent in the Customers table?", ["Start with SELECT.", "Use the Customers table.", "A full extract uses SELECT * FROM Customers."]),
  lesson("ba-new-m0-lesson-2", "sql-foundations", 2, 2, "Selecting Specific Columns", "exercise", 10, "foundation", ["select", "columns", "reporting"], "A stakeholder only needs customer names and locations, not every column in the customer table.", "Business reports usually select only useful columns. This makes output easier to read and safer to share.", "Create a customer contact extract with customer ID, first name, last name, province, and city.", "Which columns would you exclude before sending this to a business user?", ["Name the columns after SELECT.", "Separate columns with commas.", "Use FROM Customers after the column list."], [
    stage("ba-new-m0-lesson-2", 1, "Select Identity and Location", "Return only CustomerID, Province, and City from Customers.", 6, 26, undefined, ["Identify the three requested columns.", "Use commas between column names.", "Use SELECT CustomerID, Province, City FROM Customers."], "guided", "foundation"),
    stage("ba-new-m0-lesson-2", 2, "Customer Contact Extract", "Create a customer contact extract containing CustomerID, FirstName, LastName, Province, and City.", 8, 2, undefined, ["The stakeholder wants five columns.", "Include the customer's name and location.", "Add FirstName and LastName to the guided query."], "business", "foundation", true),
  ]),
  lesson("ba-new-m1-lesson-3", "sql-foundations", 3, 3, "Filtering Records", "exercise", 9, "foundation", ["filtering", "where"], "Branch operations only wants Ontario customers for a local campaign check.", "WHERE keeps only rows that match a condition. It turns a broad table into a focused answer.", "Return every customer who lives in Ontario.", "What business question does the Province filter answer?", ["You need to reduce rows.", "Look at the Province column.", "Use WHERE Province = 'Ontario'."]),
  lesson("ba-new-m1-lesson-4", "filtering-sorting", 1, 4, "Combining Conditions", "exercise", 10, "foundation", ["filtering", "and-or"], "A requirements analyst needs Toronto customers in Ontario to validate a city-specific rule.", "AND narrows a result by requiring multiple conditions to be true.", "Return customers where Province is Ontario and City is Toronto.", "If the result is smaller than the Ontario-only list, what does that tell you?", ["Use two conditions.", "Both conditions must be true.", "Use WHERE Province = 'Ontario' AND City = 'Toronto'."]),
  lesson("ba-new-m1-lesson-5", "filtering-sorting", 2, 5, "Sorting Results", "exercise", 8, "foundation", ["order-by", "reporting"], "Customer service wants recent customers first while reviewing onboarding activity.", "ORDER BY changes result order without changing which rows are returned.", "Return customers ordered by CustomerSince with newest customers first.", "Why is sorting important when a human is reviewing the result?", ["You need ordering, not filtering.", "Use CustomerSince.", "Newest first means DESC."]),
  lesson("ba-new-m2-lesson-6", "filtering-sorting", 3, 6, "Limiting Results", "review", 7, "foundation", ["top-limit", "reporting"], "Your manager wants a quick sample before approving a larger report extract.", "TOP limits returned rows. Pair limits with ORDER BY when the chosen rows need to be deterministic.", "Show the first 10 customer records from SQLBank.", "Why might a learner sample data before building a full report?", ["Use TOP after SELECT.", "Keep the Customers table.", "Ask for 10 rows."]),
  lesson("ba-new-m2-lesson-7", "summarizing-data", 1, 7, "Counting Records", "exercise", 8, "foundation", ["count", "aggregation"], "A dashboard owner asks how many loan applications exist in the training dataset.", "COUNT summarizes rows into a number. It is often the first metric stakeholders ask for.", "Return the total number of records in Applications.", "What does the count measure, and what does it not tell you?", ["Use COUNT(*).", "The table is Applications.", "This returns one row with one value."]),
  lesson("ba-new-m2-lesson-8", "summarizing-data", 2, 8, "Grouping Business Data", "assignment", 12, "foundation", ["group-by", "count", "reporting"], "Lending leadership wants application volume by status to understand the pipeline.", "GROUP BY creates one summary row per category. It turns raw records into a report.", "Return each application Status and the number of applications in that status.", "Which status needs the most operational attention?", ["Status is the category.", "COUNT(*) is the metric.", "GROUP BY Status."]),
  lesson("ba-new-m3-lesson-9", "summarizing-data", 3, 9, "Aggregating Values", "exercise", 10, "intermediate", ["sum", "avg", "aggregation"], "Finance wants total and average loan exposure for active reporting.", "SUM and AVG calculate business measures. Used together, they explain both total size and typical size.", "Return total loan amount and average loan amount from Loans.", "How would total exposure and average exposure be used differently?", ["Use SUM on LoanAmount.", "Use AVG on LoanAmount.", "Both come from Loans."]),
  lesson("ba-new-m3-lesson-10", "joining-tables", 1, 10, "INNER JOIN", "assignment", 14, "intermediate", ["inner-join", "table-relationships", "reporting"], "The branch manager needs application records with branch names instead of branch IDs.", "JOIN combines related tables. Business users usually need descriptive fields from lookup tables, not just IDs.", "Return application ID, branch name, requested amount, and status.", "Why is BranchName more useful than BranchID in a stakeholder report?", ["Applications has BranchID.", "Branches also has BranchID.", "Join on matching BranchID values."]),
  lesson("ba-new-m3-lesson-11", "joining-tables", 2, 11, "JOIN + GROUP BY", "assignment", 15, "intermediate", ["inner-join", "group-by", "aggregation"], "A regional director wants to compare application volume by branch.", "JOIN plus GROUP BY is a core SQL pattern: connect descriptive data, then summarize it.", "Return each BranchName and its application count.", "Which branch appears busiest, and what follow-up question would you ask?", ["Start from Applications.", "Join Branches for BranchName.", "Group by BranchName."]),
  lesson("ba-new-m6-lesson-14", "joining-tables", 3, 14, "Ranking Joined Summaries", "assignment", 15, "advanced", ["inner-join", "aggregation", "order-by"], "Executives want to know which branches hold the highest total loan value.", "Ranking helps prioritize business review. Sort the most important summary rows first.", "Return the top branches by total loan amount.", "Which branch would you investigate first and why?", ["Join Loans to Branches.", "SUM LoanAmount.", "Order the total descending."]),
  lesson("ba-new-m4-lesson-12", "business-logic", 1, 12, "CASE Statements", "exercise", 12, "intermediate", ["case", "business-logic"], "Risk operations wants requested loan amounts labeled into review bands.", "CASE creates business labels from data. It is useful when requirements define categories that are not stored in the table.", "Return ApplicationID, RequestedAmount, and a size band for each application.", "How could you validate that the bands match the written requirement?", ["CASE belongs in SELECT.", "Use RequestedAmount thresholds.", "Name the calculated label clearly."]),
  lesson("ba-new-m5-lesson-13", "business-logic", 2, 13, "Filtering By Date", "assignment", 12, "intermediate", ["dates", "filtering"], "Operations needs January 2025 applications for a monthly control check.", "Date filters turn open-ended data into a reporting period. They are essential for monthly reports and validation windows.", "Return applications submitted in January 2025.", "What does this result prove about the reporting period?", ["Use ApplicationDate.", "A month is a range.", "Use dates from 2025-01-01 through 2025-01-31."]),
  lesson("ba-new-m6-lesson-15", "sqlbank-practice", 1, 15, "Approval Rate Investigation", "project", 20, "advanced", ["case", "conditional-aggregation", "kpi-analysis", "stakeholder-requests"], "Your manager is preparing an executive update and needs the five branches with the highest application approval rate.", "Approval rate is a KPI: approved applications divided by total applications. The denominator must include all applications.", "Return BranchName and ApprovalRate for the five highest approval-rate branches.", "What does a high approval rate suggest, and what might you validate before acting on it?", ["Use all applications as the denominator.", "Use CASE to count approved rows.", "Divide approved count by total count and order the result."]),
];

const MASTER_MODULES = MODULES.map((module) => ({
  ...module,
  lessons: MASTER_LESSONS.filter((lessonDefinition) => lessonDefinition.moduleId === module.id),
})).filter((module) => module.lessons.length > 0);

const INTERVIEW_PLAYLIST = ["ba-new-m0-lesson-1", "ba-new-m1-lesson-3", "ba-new-m2-lesson-7", "ba-new-m2-lesson-8", "ba-new-m3-lesson-10", "ba-new-m3-lesson-11", "ba-new-m4-lesson-12", "ba-new-m6-lesson-15"];
const courses: CourseDefinition[] = [createBeginnerCourse(), createInterviewCourse()];

export function getCourseForSelection(_learningGoal?: string | null, experienceLevel?: string | null) {
  return getCourseForMode(experienceLevel);
}

export function getCourseForProfile(profile: Pick<Profile, "selected_role" | "sql_level"> | null) {
  return getCourseForMode(profile?.sql_level);
}

export function getDailyCommitment(profile: Pick<Profile, "daily_commitment_minutes"> | null | undefined): DailyCommitment {
  const value = profile?.daily_commitment_minutes;
  return dailyCommitmentOptions.includes(value as DailyCommitment) ? (value as DailyCommitment) : 30;
}

export function allSqlCourses() {
  return courses;
}

export function getMasterCurriculum() {
  return MASTER_MODULES;
}

export function getCourseForMode(value?: string | null) {
  const modeId = normalizeLearningModeId(value);
  if (!isLearningModeActive(modeId)) return null;
  return courses.find((course) => course.learningModeId === modeId) ?? courses[0];
}

export function isModuleBeforeRecommendedStart(courseDefinition: CourseDefinition, module: ModuleDefinition) {
  const startIndex = courseDefinition.modules.findIndex((candidate) => candidate.id === courseDefinition.recommendedStartModuleId);
  const moduleIndex = courseDefinition.modules.findIndex((candidate) => candidate.id === module.id);
  return startIndex > 0 && moduleIndex >= 0 && moduleIndex < startIndex;
}

export function getLessonById(lessonId: string): LessonBundle | null {
  for (const courseDefinition of courses) {
    for (const module of courseDefinition.modules) {
      const lessonDefinition = module.lessons.find((candidate) => candidate.id === lessonId);
      if (lessonDefinition) return { course: courseDefinition, module, lesson: lessonDefinition };
    }
  }
  return null;
}

export function getLessonByIdInCourse(courseDefinition: CourseDefinition, lessonId: string): LessonBundle | null {
  for (const module of courseDefinition.modules) {
    const lessonDefinition = module.lessons.find((candidate) => candidate.id === lessonId);
    if (lessonDefinition) return { course: courseDefinition, module, lesson: lessonDefinition };
  }
  return null;
}

export function resolveCurriculumPosition(courseDefinition: CourseDefinition, lessonId: string, questionIndex: number): CurriculumPosition | null {
  const courseIndex = courses.findIndex((course) => course.id === courseDefinition.id);
  const moduleIndex = courseDefinition.modules.findIndex((module) => module.lessons.some((lessonDefinition) => lessonDefinition.id === lessonId));
  const module = courseDefinition.modules[moduleIndex];
  if (!module) return null;

  const lessonIndex = module.lessons.findIndex((lessonDefinition) => lessonDefinition.id === lessonId);
  const lessonDefinition = module.lessons[lessonIndex];
  if (!lessonDefinition) return null;

  const questionCount = getLessonStages(lessonDefinition).length;
  const safeQuestionIndex = clampIndex(questionIndex, questionCount);
  const hasNextQuestion = safeQuestionIndex < questionCount - 1;
  const hasNextLesson = !hasNextQuestion && lessonIndex < module.lessons.length - 1;
  const hasNextModule = !hasNextQuestion && !hasNextLesson && moduleIndex < courseDefinition.modules.length - 1;
  const nextModule = hasNextModule ? courseDefinition.modules[moduleIndex + 1] : undefined;

  return {
    courseIndex,
    moduleIndex,
    lessonIndex,
    questionIndex: safeQuestionIndex,
    questionCount,
    lessonCount: module.lessons.length,
    moduleCount: courseDefinition.modules.length,
    hasPreviousQuestion: safeQuestionIndex > 0,
    hasNextQuestion,
    hasNextLesson,
    hasNextModule,
    isLastQuestionInLesson: safeQuestionIndex === questionCount - 1,
    isLastLessonInModule: lessonIndex === module.lessons.length - 1,
    isLastModuleInCourse: moduleIndex === courseDefinition.modules.length - 1,
    isFinalCourseQuestion: safeQuestionIndex === questionCount - 1 && lessonIndex === module.lessons.length - 1 && moduleIndex === courseDefinition.modules.length - 1,
    previousQuestionIndex: safeQuestionIndex > 0 ? safeQuestionIndex - 1 : undefined,
    nextQuestionIndex: hasNextQuestion ? safeQuestionIndex + 1 : undefined,
    nextLesson: hasNextLesson ? module.lessons[lessonIndex + 1] : undefined,
    nextModule,
    nextModuleLesson: nextModule?.lessons[0],
  };
}

export function findLessonForChallenge(courseDefinition: CourseDefinition, challengeId: number) {
  return courseDefinition.modules.flatMap((module) => module.lessons).find((lessonDefinition) => lessonChallengeIds(lessonDefinition).includes(challengeId));
}

export function nextLesson(courseDefinition: CourseDefinition, progressRows: ProgressRow[]) {
  const completed = completedChallengeIds(progressRows);
  const startIndex = Math.max(0, courseDefinition.modules.findIndex((module) => module.id === courseDefinition.recommendedStartModuleId));
  const recommendedLessons = courseDefinition.modules.slice(startIndex).flatMap((module) => module.lessons);
  const reviewLessons = courseDefinition.modules.slice(0, startIndex).flatMap((module) => module.lessons);
  return [...recommendedLessons, ...reviewLessons].find((lessonDefinition) => !isLessonCompleted(lessonDefinition, completed)) ?? courseDefinition.modules[startIndex]?.lessons[0] ?? courseDefinition.modules[0]?.lessons[0] ?? null;
}

export function buildModuleProgress(courseDefinition: CourseDefinition, progressRows: ProgressRow[]): ModuleProgress[] {
  const completed = completedChallengeIds(progressRows);
  const startIndex = Math.max(0, courseDefinition.modules.findIndex((module) => module.id === courseDefinition.recommendedStartModuleId));
  let previousRecommendedComplete = true;

  return courseDefinition.modules.map((module, index) => {
    const completedLessons = module.lessons.filter((lessonDefinition) => isLessonCompleted(lessonDefinition, completed)).length;
    const totalLessons = module.lessons.length;
    const percent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const beforeStart = index < startIndex;
    const status: ModuleProgress["status"] =
      completedLessons === totalLessons
        ? "Completed"
        : completedLessons > 0
          ? "In Progress"
          : beforeStart || previousRecommendedComplete || index === startIndex
            ? "Available"
            : "Locked";
    if (!beforeStart) previousRecommendedComplete = status === "Completed";
    return { module, completedLessons, totalLessons, status, percent };
  });
}

export function deriveSkillMastery(courseDefinition: CourseDefinition, progressRows: ProgressRow[]): SkillMastery[] {
  const byChallenge = new Map(progressRows.map((row) => [row.challenge_id, row]));
  const lessonScores = new Map<string, number[]>();

  for (const module of courseDefinition.modules) {
    for (const lessonDefinition of module.lessons) {
      const stageProgress = lessonChallengeIds(lessonDefinition).map((challengeId) => byChallenge.get(challengeId)).filter(Boolean) as ProgressRow[];
      const completed = isLessonCompleted(lessonDefinition, completedChallengeIds(progressRows));
      const inProgress = stageProgress.some((progress) => progress.status === "in_progress" || progress.status === "completed");
      const attempts = stageProgress.reduce((sum, progress) => sum + (progress.attempt_count ?? 0), 0);
      const base = completed ? 78 : inProgress ? 32 : 0;
      const attemptPenalty = Math.max(0, attempts - (completed ? 1 : 0)) * 5;
      const score = Math.max(0, Math.min(100, base - attemptPenalty + (lessonDefinition.type === "project" && completed ? 8 : 0)));
      for (const skill of lessonDefinition.skills) {
        const scores = lessonScores.get(skill) ?? [];
        scores.push(score);
        lessonScores.set(skill, scores);
      }
    }
  }

  return courseDefinition.skills.map((skill) => {
    const scores = lessonScores.get(skill) ?? [];
    const mastery = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    return { skill, mastery };
  });
}

export function courseCompletionPercent(courseDefinition: CourseDefinition, progressRows: ProgressRow[]) {
  const lessons = courseDefinition.modules.flatMap((module) => module.lessons);
  if (!lessons.length) return 0;
  const completed = completedChallengeIds(progressRows);
  return Math.round((lessons.filter((lessonDefinition) => isLessonCompleted(lessonDefinition, completed)).length / lessons.length) * 100);
}

export function isCourseCompleted(courseDefinition: CourseDefinition, progressRows: ProgressRow[]) {
  return isCourseCompletedByChallengeIds(courseDefinition, completedChallengeIds(progressRows));
}

export function isCourseCompletedByChallengeIds(courseDefinition: CourseDefinition, completed: Set<number>) {
  const lessons = courseDefinition.modules.flatMap((module) => module.lessons);
  return lessons.length > 0 && lessons.every((lessonDefinition) => isLessonCompleted(lessonDefinition, completed));
}

export function readinessScore(courseDefinition: CourseDefinition, progressRows: ProgressRow[]) {
  const mastery = deriveSkillMastery(courseDefinition, progressRows);
  if (!mastery.length) return 0;
  const coreSkills = ["select", "filtering", "aggregation", "group-by", "inner-join", "case"];
  const appliedSkills = ["kpi-analysis", "stakeholder-requests", "target-analysis", "investigation", "grain"];
  const coreAverage = average(mastery.filter((item) => coreSkills.includes(item.skill)).map((item) => item.mastery));
  const appliedAverage = average(mastery.filter((item) => appliedSkills.includes(item.skill)).map((item) => item.mastery));
  return Math.round(coreAverage * 0.65 + appliedAverage * 0.35);
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

export function lessonUrl(lessonDefinition: LessonDefinition) {
  return `/learn/lesson/${lessonDefinition.id}`;
}

export function challengeForLesson(lessonDefinition: LessonDefinition, challenges: Challenge[]) {
  return challenges.find((challenge) => challenge.id === lessonDefinition.challengeId);
}

export function getLessonStages(lessonDefinition: LessonDefinition): LessonStageDefinition[] {
  if (lessonDefinition.stages?.length) return lessonDefinition.stages;
  return [
    {
      id: `${lessonDefinition.id}-question-1`,
      lessonId: lessonDefinition.id,
      sequence: 1,
      type: lessonDefinition.type === "review" ? "review" : "business_task",
      title: lessonDefinition.title,
      instructions: lessonDefinition.independentPrompt,
      estimatedMinutes: lessonDefinition.estimatedMinutes,
      challengeId: lessonDefinition.challengeId,
      hints: lessonDefinition.hints,
      questionType: lessonDefinition.type === "project" ? "capstone" : "business",
      databaseId: lessonDefinition.databaseId,
      difficultyId: lessonDefinition.difficultyId,
    },
  ];
}

function createBeginnerCourse(): CourseDefinition {
  const modeId: LearningModeId = "completely-new";
  const config = LEARNING_MODE_CONFIG[modeId];
  return createCourse({
    id: "sql-curriculum-beginner",
    learningModeId: modeId,
    title: "Beginner",
    shortTitle: "Beginner SQL Path",
    description: "Learn SQL from scratch by working with the SQLBank database.",
    assistanceLevel: config.assistanceLevel,
    recommendedStartModuleId: config.startModuleId,
    modules: MASTER_MODULES,
  });
}

function createInterviewCourse(): CourseDefinition {
  const lessons = INTERVIEW_PLAYLIST
    .map((id) => MASTER_LESSONS.find((lessonDefinition) => lessonDefinition.id === id))
    .filter((lessonDefinition): lessonDefinition is LessonDefinition => Boolean(lessonDefinition))
    .map((lessonDefinition, index) => ({
      ...lessonDefinition,
      sequence: index + 1,
      type: "interview" as const,
      hints: lessonDefinition.hints.slice(0, 1),
      stages: lessonDefinition.stages?.map((stageDefinition) => ({ ...stageDefinition, hints: stageDefinition.hints.slice(0, 1), starterSql: undefined, questionType: "interview" as const })),
    }));

  const moduleDefinitions: Omit<ModuleDefinition, "lessons">[] = [
    { id: "interview-fundamentals", sequence: 1, title: "Fundamentals Review", description: "Refresh SELECT, filtering, and counting patterns that appear in SQL interviews.", estimatedMinutes: 25, prerequisiteSkills: [] },
    { id: "interview-aggregation-joins", sequence: 2, title: "Aggregation & JOINs", description: "Practice grouped metrics and table relationships with concise interview-style prompts.", estimatedMinutes: 35, prerequisiteSkills: ["select", "filtering"] },
    { id: "interview-business-logic", sequence: 3, title: "Business Logic & Scenarios", description: "Prepare for KPI, CASE, target comparison, and investigation prompts.", estimatedMinutes: 40, prerequisiteSkills: ["aggregation", "joins"] },
  ];

  const modules = moduleDefinitions.map((module) => ({
    ...module,
    lessons: lessons.filter((lessonDefinition) => {
      if (module.id === "interview-fundamentals") return [1, 3, 7].includes(lessonDefinition.challengeId);
      if (module.id === "interview-aggregation-joins") return [8, 10, 11].includes(lessonDefinition.challengeId);
      return [12, 15].includes(lessonDefinition.challengeId);
    }).map((lessonDefinition, index) => ({ ...lessonDefinition, moduleId: module.id, sequence: index + 1 })),
  })).filter((module) => module.lessons.length > 0);

  return createCourse({
    id: "sql-interview-prep",
    learningModeId: "quick-interview-prep",
    title: "Quick Interview Prep",
    shortTitle: "Interview Prep",
    description: "Review essential SQL and practice interview-style questions.",
    assistanceLevel: "interview",
    recommendedStartModuleId: "interview-fundamentals",
    modules,
  });
}

function createCourse(options: {
  assistanceLevel: AssistanceLevel;
  description: string;
  id: string;
  learningModeId: LearningModeId;
  modules: ModuleDefinition[];
  recommendedStartModuleId: string;
  shortTitle: string;
  title: string;
}): CourseDefinition {
  const modules = options.modules.map((module) => ({
    ...module,
    lessons: module.lessons.map((lessonDefinition) => applyAssistanceToLesson(lessonDefinition, options.assistanceLevel)),
  }));
  const lessons = modules.flatMap((module) => module.lessons);
  const lessonCount = lessons.length;
  const questionCount = lessons.reduce((sum, lessonDefinition) => sum + getLessonStages(lessonDefinition).length, 0);
  const exerciseCount = lessons.filter((lessonDefinition) => lessonDefinition.type === "exercise" || lessonDefinition.type === "assignment" || lessonDefinition.type === "review").length;
  const projectCount = lessons.filter((lessonDefinition) => lessonDefinition.type === "project").length;
  const capstoneCount = lessons.filter((lessonDefinition) => lessonDefinition.type === "project" || lessonDefinition.title.toLowerCase().includes("investigation")).length;

  return {
    id: options.id,
    learningModeId: options.learningModeId,
    recommendedStartModuleId: options.recommendedStartModuleId,
    experienceLevel: learningModeLabel(options.learningModeId),
    assistanceLevel: options.assistanceLevel,
    title: options.title,
    shortTitle: options.shortTitle,
    description: options.description,
    lessonCountLabel: pluralize(lessonCount, "lesson"),
    questionCountLabel: pluralize(questionCount, "question"),
    moduleCountLabel: pluralize(modules.length, "module"),
    exerciseCountLabel: pluralize(exerciseCount, "exercise"),
    projectCountLabel: pluralize(projectCount, "project"),
    capstoneCountLabel: pluralize(capstoneCount, "capstone"),
    difficulty: learningModeLabel(options.learningModeId),
    skills: unique(lessons.flatMap((lessonDefinition) => lessonDefinition.skills)),
    modules,
  };
}

function applyAssistanceToLesson(lessonDefinition: LessonDefinition, assistanceLevel: AssistanceLevel): LessonDefinition {
  if (assistanceLevel === "guided" || assistanceLevel === "standard") return lessonDefinition;
  const hintLimit = assistanceLevel === "interview" || assistanceLevel === "minimal" ? 1 : 2;
  return {
    ...lessonDefinition,
    guidedPrompt: lessonDefinition.independentPrompt,
    hints: lessonDefinition.hints.slice(0, hintLimit),
    stages: lessonDefinition.stages?.map((stageDefinition) => ({
      ...stageDefinition,
      starterSql: assistanceLevel === "light" ? stageDefinition.starterSql : undefined,
      hints: stageDefinition.hints.slice(0, hintLimit),
    })),
  };
}

function lesson(id: string, moduleId: string, sequence: number, challengeId: number, title: string, type: LessonType, estimatedMinutes: number, difficultyId: DifficultyId, skills: string[], businessContext: string, concept: string, independentPrompt: string, interpretationPrompt: string, hints: string[], stages?: LessonStageDefinition[]): LessonDefinition {
  return {
    id,
    moduleId,
    sequence,
    challengeId,
    title,
    type,
    estimatedMinutes,
    difficulty: difficultyLabel(difficultyId),
    difficultyId,
    databaseId: "sqlbank",
    skills,
    businessContext,
    concept,
    guidedPrompt: independentPrompt,
    independentPrompt,
    interpretationPrompt,
    hints,
    stages,
  };
}

function stage(lessonId: string, sequence: number, title: string, instructions: string, estimatedMinutes: number, challengeId: number | undefined, starterSql: string | undefined, hints: string[] = [], questionType: QuestionType = "business", difficultyId: DifficultyId = "foundation", carryForwardQuery = false): LessonStageDefinition {
  return {
    id: `${lessonId}-question-${sequence}`,
    lessonId,
    sequence,
    type: questionType === "guided" ? "guided_exercise" : questionType === "independent" ? "independent_exercise" : "business_task",
    title,
    instructions,
    estimatedMinutes,
    challengeId,
    starterSql,
    hints,
    carryForwardQuery,
    questionType,
    databaseId: "sqlbank",
    difficultyId,
  };
}

function lessonChallengeIds(lessonDefinition: LessonDefinition) {
  const stageIds = (lessonDefinition.stages ?? [])
    .map((stageDefinition) => stageDefinition.challengeId)
    .filter((challengeId): challengeId is number => typeof challengeId === "number");
  return stageIds.length ? stageIds : [lessonDefinition.challengeId];
}

function isLessonCompleted(lessonDefinition: LessonDefinition, completed: Set<number>) {
  if (completed.has(lessonDefinition.challengeId)) return true;
  const requiredChallengeIds = lessonChallengeIds(lessonDefinition);
  return requiredChallengeIds.length > 0 && requiredChallengeIds.every((challengeId) => completed.has(challengeId));
}

function completedChallengeIds(progressRows: ProgressRow[]) {
  return new Set(progressRows.filter((row) => row.status === "completed").map((row) => row.challenge_id));
}

function clampIndex(index: number, count: number) {
  if (count <= 0) return 0;
  return Math.min(Math.max(index, 0), count - 1);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function difficultyLabel(difficultyId: DifficultyId) {
  if (difficultyId === "foundation") return "Beginner";
  if (difficultyId === "intermediate") return "Intermediate";
  if (difficultyId === "advanced") return "Advanced";
  return "Expert";
}

function pluralize(count: number, label: string) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
