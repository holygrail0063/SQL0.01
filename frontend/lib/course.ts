import type { Challenge } from "@/lib/api";
import type { Profile, ProgressRow } from "@/lib/progress";

export const dailyCommitmentOptions = [15, 30, 45, 60] as const;

export type DailyCommitment = (typeof dailyCommitmentOptions)[number];
export type ExperienceLevel = "Completely New" | "Know the Basics" | "Comfortable With SQL" | "Interview Preparation";
export type LessonType = "concept" | "exercise" | "assignment" | "review" | "interview" | "project";
export type LearningGoal = "Business Analyst" | "Data Analyst";
export type LessonStageType = "concept" | "guided_exercise" | "independent_exercise" | "business_task" | "interpretation" | "review";

export type CourseDefinition = {
  id: string;
  learningGoal: LearningGoal;
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

const businessAnalystSkills = [
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

const dataAnalystSkills = [
  "SQL Fundamentals",
  "SELECT",
  "Filtering",
  "Dates",
  "Aggregations",
  "GROUP BY",
  "HAVING",
  "CASE",
  "JOINs",
  "Table Grain",
  "NULL Handling",
  "Data Cleaning",
  "Subqueries",
  "CTEs",
  "Window Functions",
  "ROW_NUMBER",
  "RANK",
  "LAG / LEAD",
  "Conditional Aggregation",
  "KPI Analysis",
  "Trend Analysis",
  "Period Comparison",
  "Customer Segmentation",
  "Funnel Analysis",
  "Retention Analysis",
  "Cohort Analysis",
  "Dashboard Dataset Preparation",
  "Analytical Investigation",
  "Analytical Interpretation",
];

const baseLessons: LessonDefinition[] = [
  lesson("ba-new-m0", 1, "Understanding Business Tables", "concept", 8, "Beginner", ["Database Fundamentals", "SELECT"], "Your team lead asks for a complete customer extract so you can understand what columns SQLBank stores.", "A table is a structured list of records. SELECT chooses what to show, and FROM names the table you are reading from.", "Start with a full table extract so you can inspect the shape of the customer data.", "Your manager needs every customer record available for a data inventory.", "What do the rows represent, and why might a BA inspect all columns before narrowing the query?", ["Start with SELECT.", "Use the Customers table.", "A full extract uses SELECT * FROM Customers."]),
  lesson("ba-new-m0", 2, "Choosing Business Columns", "exercise", 8, "Beginner", ["SELECT", "Aliases", "Operational Reporting"], "A stakeholder only needs customer names and locations, not every column in the customer table.", "Business reports should usually select only useful columns. This makes the output easier to read and safer to share.", "Return only the customer identity and location fields.", "Create a customer contact extract with customer ID, first name, last name, province, and city.", "Which columns would you exclude before sending this to a business user?", ["Name the columns after SELECT.", "Separate columns with commas.", "Use FROM Customers after the column list."], [
    stage("ba-new-m0-lesson-2", "concept", 1, "Choose Specific Columns", "Business reports should usually select only useful columns. This makes the output easier to read and safer to share.\n\nExample:\nSELECT FirstName, Province\nFROM Customers;\n\nSELECT determines which columns appear. FROM determines which table is queried. Commas separate selected columns.", 3, undefined, undefined, []),
    stage("ba-new-m0-lesson-2", "guided_exercise", 2, "Select Identity and Location", "Return only:\n- CustomerID\n- Province\n- City", 8, 26, "SELECT \nFROM Customers;", ["Identify the three requested columns.", "The columns are CustomerID, Province, and City.", "Use SELECT CustomerID, Province, City FROM Customers."]),
    stage("ba-new-m0-lesson-2", "business_task", 3, "Customer Contact Extract", "Create a customer contact extract containing:\n- CustomerID\n- FirstName\n- LastName\n- Province\n- City", 10, 2, undefined, ["The stakeholder wants five columns from Customers.", "Include CustomerID with the customer's name and location.", "Add FirstName and LastName to the guided exercise query."], true),
  ]),
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

const dataAnalystLessons: LessonDefinition[] = [
  lesson("da-new-m0", 16, "Build A Customer Directory", "concept", 10, "Beginner", ["SQL Fundamentals", "SELECT", "Table Grain"], "Your analytics manager wants a clean customer-level file before anyone starts measuring behavior.", "A Data Analyst starts by understanding grain: what one row represents. In Customers, one row represents one customer.", "Select only the customer fields needed for the analysis-ready directory.", "Return the customer directory requested by the analytics manager.", "Why is one row per customer safer than mixing customer rows with transaction rows too early?", ["Start with SELECT.", "List the requested customer columns.", "Use FROM Customers."]),
  lesson("da-new-m1", 17, "Summarize Account Types", "exercise", 12, "Beginner", ["Filtering", "GROUP BY", "Aggregations"], "The product analytics lead wants to understand which active account types customers actually use.", "GROUP BY summarizes rows by a category. Filtering first keeps the denominator aligned with the business question.", "Filter active accounts, then count rows by AccountType.", "Return active account counts by account type.", "What would change if closed accounts were included?", ["Use Accounts.", "Filter AccountStatus = 'Active'.", "Group by AccountType and count rows."]),
  lesson("da-new-m1", 18, "Review High-Value Transactions", "assignment", 14, "Beginner", ["Filtering", "ORDER BY", "Data Validation"], "Customer Analytics is reviewing large successful transactions to understand high-value activity.", "Filtering defines the analytical population. ORDER BY makes review outputs useful for humans.", "Keep successful transactions above the threshold and sort the biggest values first.", "Return the 25 largest successful transactions over 1000.", "Is a high-value transaction necessarily unusual, or do you need more context?", ["Use Transactions.", "You need two WHERE conditions.", "Use TOP 25 with ORDER BY Amount DESC."]),
  lesson("da-new-m2", 19, "Analyze Monthly Transaction Trends", "assignment", 18, "Intermediate", ["Dates", "Trend Analysis", "Aggregations"], "Your team lead asks whether customer activity is increasing or weakening over time.", "Trend analysis groups activity into periods, then compares volume, value, and averages.", "Create a month field from TransactionDate and calculate monthly metrics.", "Return monthly transaction count, value, and average value for successful transactions.", "Which metric would you inspect first if count rises but average value falls?", ["Use SUBSTRING(TransactionDate, 1, 7).", "Filter successful transactions.", "Group and order by the month expression."]),
  lesson("da-new-m3", 20, "Compare Customer Segments", "assignment", 16, "Intermediate", ["JOINs", "Table Grain", "Customer Segmentation"], "Customer Strategy wants to know which segments hold the most active account balances.", "Joining customer and account data changes grain. COUNT(DISTINCT CustomerID) protects customer counts from account duplication.", "Join Customers to Accounts, filter active accounts, and summarize by CustomerSegment.", "Return active customer counts and balances by segment.", "Where could this query double-count customers if written carelessly?", ["Join on CustomerID.", "Use COUNT(DISTINCT c.CustomerID).", "Group by CustomerSegment."]),
  lesson("da-new-m4", 21, "Build A KPI Scorecard", "assignment", 18, "Intermediate", ["KPI Analysis", "CASE", "Conditional Aggregation"], "Lending Analytics needs a 2025 monthly application scorecard for leadership.", "A KPI is only useful when the numerator, denominator, and grain are correct.", "Calculate monthly applications, approvals, approval rate, and average requested amount.", "Return the requested 2025 KPI scorecard.", "What is the denominator for approval rate, and why?", ["Use CASE inside SUM for approvals.", "Use COUNT(*) as applications.", "Filter ApplicationDate to 2025."]),
  lesson("da-new-m5", 22, "Analyze Signup Funnel Conversion", "project", 22, "Advanced", ["Funnel Analysis", "Conditional Aggregation", "Analytical Interpretation"], "Growth wants to know which acquisition channels lose customers during signup.", "Funnels are user-level analyses. Count distinct customers per stage so repeated events do not inflate conversion.", "Count signup started, signup completed, and account opened by channel.", "Return channel-level funnel counts and completion rate.", "Which channel should Growth investigate first, and what else would you validate?", ["Use CustomerEvents.", "Each funnel step can be counted with COUNT(DISTINCT CASE WHEN ...).", "Group by Channel."]),
  lesson("da-new-m6", 23, "Measure Product Adoption", "assignment", 16, "Intermediate", ["Product Analysis", "JOINs", "Aggregations"], "Product Strategy asks which products have the most active adoption.", "Product adoption should be tied to actual usage or active accounts, not just a product catalog row.", "Join Products to active Accounts and summarize account counts and balances.", "Return active account adoption by product.", "Does active account count measure customers or accounts?", ["Join Products to Accounts on ProductID.", "Filter AccountStatus = 'Active'.", "Group by ProductName and ProductCategory."]),
  lesson("da-new-m7", 24, "Compare Actuals To Targets", "project", 24, "Advanced", ["CTEs", "Dashboard Dataset Preparation", "Period Comparison"], "Operations wants to know which branches beat monthly application targets.", "Analysts often build actuals in one step, targets in another, then compare them at the same grain.", "Use a CTE to aggregate branch-month actuals before joining MonthlyTargets.", "Return the top branch-month target achievement rates.", "How can mismatched grain create an inflated achievement rate?", ["Create branch-month actuals first.", "Join on BranchID and Month.", "Calculate actual applications divided by target."]),
  lesson("da-new-m8", 25, "Investigate Customer Engagement", "project", 28, "Advanced", ["Analytical Investigation", "Trend Analysis", "Retention Analysis"], "Senior leadership believes engagement has weakened and needs evidence before acting.", "An investigation starts by defining metrics. Active customers, transaction count, and transaction value each answer a different part of engagement.", "Join Transactions to Accounts, group by month, and calculate engagement metrics.", "Return monthly active customers, transaction count, and transaction value.", "Is this output enough to prove the cause of engagement decline? What would you segment next?", ["Transactions need Accounts to reach CustomerID.", "Use COUNT(DISTINCT a.CustomerID).", "Group by transaction month."]),
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
  course("Business Analyst", "ba-completely-new", "Completely New", "Business Analyst SQL Path", "Business Analyst - Completely New", "Learn SQL from the beginning while working through realistic SQLBank Business Analyst assignments.", "10-12 weeks", "~65 lessons", "120+ exercises", "6 projects", "1 capstone", "Beginner to Workplace SQL", baseLessons),
  course("Business Analyst", "ba-know-basics", "Know the Basics", "Business Analyst SQL Acceleration Path", "Business Analyst - Know the Basics", "Review the essentials quickly, then build confidence solving real SQLBank business requests.", "6-8 weeks", "~40 lessons", "80+ exercises", "4 projects", "1 capstone", "Fundamentals to Applied Analysis", baseLessons.filter((lesson) => lesson.challengeId >= 3)),
  course("Business Analyst", "ba-comfortable", "Comfortable With SQL", "Advanced Business Analyst SQL Path", "Business Analyst - Comfortable With SQL", "Skip basic syntax review and focus on analysis, joins, KPIs, validation, and investigations.", "4-6 weeks", "~30 lessons", "60+ exercises", "3 projects", "1 capstone", "Intermediate to Advanced BA SQL", baseLessons.filter((lesson) => lesson.challengeId >= 9)),
  course("Business Analyst", "ba-interview", "Interview Preparation", "Business Analyst SQL Interview Path", "Business Analyst - Interview Preparation", "Practice SQL explanations, timed query writing, debugging, and Business Analyst scenario questions.", "2-4 weeks", "40 questions + 15 coding drills", "Timed practice sets", "Mock interview flow", "1 readiness review", "Interview Readiness", baseLessons.filter((lesson) => [3, 7, 8, 10, 12, 15].includes(lesson.challengeId)).map((lesson) => ({ ...lesson, type: "interview" as const }))),
  course("Data Analyst", "da-completely-new", "Completely New", "Data Analyst SQL Path", "Data Analyst - Completely New", "Learn SQL from the beginning by analyzing realistic SQLBank customer, product, transaction, lending, and performance data.", "10-12 weeks", "~70 lessons", "140+ exercises", "6 mini-projects", "1 analytical capstone", "Beginner to Analytical SQL", dataAnalystLessons),
  course("Data Analyst", "da-know-basics", "Know the Basics", "Data Analyst SQL Acceleration Path", "Data Analyst - Know the Basics", "Skip light syntax review and build confidence with aggregations, joins, dates, KPIs, segmentation, and trends.", "6-8 weeks", "~45 lessons", "90+ exercises", "4 mini-projects", "1 analytical capstone", "Fundamentals to Applied Analytics", dataAnalystLessons.filter((lesson) => lesson.challengeId >= 17)),
  course("Data Analyst", "da-comfortable", "Comfortable With SQL", "Advanced Data Analyst SQL Path", "Data Analyst - Comfortable With SQL", "Focus on professional analytical SQL: KPI design, table grain, funnels, target analysis, and open-ended investigations.", "4-6 weeks", "~35 lessons", "70+ exercises", "4 case studies", "1 analytical capstone", "Intermediate to Advanced Analytics", dataAnalystLessons.filter((lesson) => lesson.challengeId >= 19)),
  course("Data Analyst", "da-interview", "Interview Preparation", "Data Analyst SQL Interview Path", "Data Analyst - Interview Preparation", "Practice SQL screens, query explanation, debugging, metric reasoning, and Data Analyst scenario questions.", "2-4 weeks", "40 questions + 10 coding drills", "Timed practice sets", "Scenario drills", "1 readiness review", "Interview Readiness", dataAnalystLessons.filter((lesson) => [17, 19, 20, 21, 22, 24, 25].includes(lesson.challengeId)).map((lesson) => ({ ...lesson, type: "interview" as const }))),
];

export function getBusinessAnalystCourse(experienceLevel?: string | null) {
  return courses.find((course) => course.learningGoal === "Business Analyst" && course.experienceLevel === experienceLevel) ?? courses.find((course) => course.id === "ba-completely-new")!;
}

export function getDataAnalystCourse(experienceLevel?: string | null) {
  return courses.find((course) => course.learningGoal === "Data Analyst" && course.experienceLevel === experienceLevel) ?? courses.find((course) => course.id === "da-completely-new")!;
}

export function getCourseForSelection(learningGoal?: string | null, experienceLevel?: string | null) {
  const safeExperience = experienceLevel === "Interview Preparation" ? "Completely New" : experienceLevel;
  if (learningGoal === "Business Analyst") return getBusinessAnalystCourse(safeExperience);
  if (learningGoal === "Data Analyst") return getDataAnalystCourse(safeExperience);
  return null;
}

export function getCourseForProfile(profile: Pick<Profile, "selected_role" | "sql_level"> | null) {
  if (!profile?.selected_role) return getBusinessAnalystCourse("Completely New");
  return getCourseForSelection(profile.selected_role, profile.sql_level);
}

export function getDailyCommitment(profile: Pick<Profile, "daily_commitment_minutes"> | null | undefined): DailyCommitment {
  const value = profile?.daily_commitment_minutes;
  return dailyCommitmentOptions.includes(value as DailyCommitment) ? (value as DailyCommitment) : 30;
}

export function allBusinessAnalystCourses() {
  return courses.filter((course) => course.learningGoal === "Business Analyst");
}

export function allDataAnalystCourses() {
  return courses.filter((course) => course.learningGoal === "Data Analyst");
}

export function getLessonById(lessonId: string): LessonBundle | null {
  for (const courseDefinition of courses) {
    for (const module of courseDefinition.modules) {
      const lesson = module.lessons.find((candidate) => candidate.id === lessonId);
      if (lesson) return { course: courseDefinition, module, lesson };
    }
  }
  return null;
}

export function getLessonByIdInCourse(courseDefinition: CourseDefinition, lessonId: string): LessonBundle | null {
  for (const module of courseDefinition.modules) {
    const lesson = module.lessons.find((candidate) => candidate.id === lessonId);
    if (lesson) return { course: courseDefinition, module, lesson };
  }
  return null;
}

export function resolveCurriculumPosition(courseDefinition: CourseDefinition, lessonId: string, questionIndex: number): CurriculumPosition | null {
  const courseIndex = courses.findIndex((course) => course.id === courseDefinition.id);
  const moduleIndex = courseDefinition.modules.findIndex((module) => module.lessons.some((lesson) => lesson.id === lessonId));
  const module = courseDefinition.modules[moduleIndex];
  if (!module) return null;

  const lessonIndex = module.lessons.findIndex((lesson) => lesson.id === lessonId);
  const lesson = module.lessons[lessonIndex];
  if (!lesson) return null;

  const questionCount = getLessonStages(lesson).length;
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
  return courseDefinition.modules.flatMap((module) => module.lessons).find((lesson) => lessonChallengeIds(lesson).includes(challengeId));
}

export function nextLesson(courseDefinition: CourseDefinition, progressRows: ProgressRow[]) {
  const completed = completedChallengeIds(progressRows);
  return courseDefinition.modules.flatMap((module) => module.lessons).find((lesson) => !isLessonCompleted(lesson, completed)) ?? courseDefinition.modules[0]?.lessons[0] ?? null;
}

export function buildModuleProgress(courseDefinition: CourseDefinition, progressRows: ProgressRow[]): ModuleProgress[] {
  const completed = completedChallengeIds(progressRows);
  let previousComplete = true;

  return courseDefinition.modules.map((module, index) => {
    const completedLessons = module.lessons.filter((lesson) => isLessonCompleted(lesson, completed)).length;
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
  return Math.round((lessons.filter((lesson) => isLessonCompleted(lesson, completed)).length / lessons.length) * 100);
}

export function isCourseCompleted(courseDefinition: CourseDefinition, progressRows: ProgressRow[]) {
  return isCourseCompletedByChallengeIds(courseDefinition, completedChallengeIds(progressRows));
}

export function isCourseCompletedByChallengeIds(courseDefinition: CourseDefinition, completed: Set<number>) {
  const lessons = courseDefinition.modules.flatMap((module) => module.lessons);
  return lessons.length > 0 && lessons.every((lesson) => isLessonCompleted(lesson, completed));
}

export function readinessScore(courseDefinition: CourseDefinition, progressRows: ProgressRow[]) {
  const mastery = deriveSkillMastery(courseDefinition, progressRows);
  if (!mastery.length) return 0;
  const coreSkills = courseDefinition.learningGoal === "Data Analyst"
    ? ["SQL Fundamentals", "SELECT", "Filtering", "Dates", "Aggregations", "GROUP BY", "CASE", "JOINs", "CTEs", "Window Functions"]
    : ["SELECT", "Filtering", "Aggregate Functions", "GROUP BY", "INNER JOIN", "CASE"];
  const roleSkillWords = courseDefinition.learningGoal === "Data Analyst"
    ? ["Analysis", "Segmentation", "Funnel", "Retention", "Cohort", "Dashboard", "Investigation", "Interpretation", "Grain", "KPI"]
    : ["Analysis", "Validation", "Reporting", "Interpretation"];
  const core = mastery.filter((item) => coreSkills.includes(item.skill));
  const ba = mastery.filter((item) => roleSkillWords.some((word) => item.skill.includes(word)));
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

export function getLessonStages(lesson: LessonDefinition): LessonStageDefinition[] {
  if (lesson.stages?.length) return lesson.stages;
  return [
    {
      id: `${lesson.id}-exercise`,
      lessonId: lesson.id,
      sequence: 1,
      type: lesson.type === "review" ? "review" : "business_task",
      title: lesson.title,
      instructions: lesson.independentPrompt,
      estimatedMinutes: lesson.estimatedMinutes,
      challengeId: lesson.challengeId,
      hints: lesson.hints,
    },
  ];
}

function course(
  learningGoal: LearningGoal,
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
  const lessonCount = modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const exerciseCount = lessons.filter((lesson) => lesson.type === "exercise" || lesson.type === "assignment" || lesson.type === "review").length;
  const projectCount = lessons.filter((lesson) => lesson.type === "project").length;
  const capstoneCount = lessons.filter((lesson) => lesson.title.toLowerCase().includes("capstone")).length;
  return {
    id,
    learningGoal,
    experienceLevel,
    title,
    shortTitle,
    description,
    estimatedWeeks,
    lessonCountLabel: pluralize(lessonCount, "lesson"),
    exerciseCountLabel: pluralize(exerciseCount, "exercise"),
    projectCountLabel: pluralize(projectCount, "project"),
    capstoneCountLabel: pluralize(capstoneCount, "capstone"),
    difficulty,
    skills: learningGoal === "Data Analyst" ? dataAnalystSkills : businessAnalystSkills,
    modules,
  };
}

function pluralize(count: number, label: string) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
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
    "da-new-m0": { id: "da-new-m0", sequence: 0, title: "Understanding Analytical Data", description: "Learn tables, rows, columns, keys, and the grain of SQLBank customer data.", estimatedMinutes: 40, prerequisiteSkills: [] },
    "da-new-m1": { id: "da-new-m1", sequence: 1, title: "Reading and Filtering Data", description: "Select useful analytical fields, filter rows, and produce review-ready outputs.", estimatedMinutes: 55, prerequisiteSkills: ["SQL Fundamentals"] },
    "da-new-m2": { id: "da-new-m2", sequence: 2, title: "Date-Based Trend Analysis", description: "Group activity into reporting periods and separate count, total, and average metrics.", estimatedMinutes: 45, prerequisiteSkills: ["Filtering"] },
    "da-new-m3": { id: "da-new-m3", sequence: 3, title: "JOINs and Table Grain", description: "Combine customer and account data without inflating customer-level metrics.", estimatedMinutes: 55, prerequisiteSkills: ["GROUP BY"] },
    "da-new-m4": { id: "da-new-m4", sequence: 4, title: "KPI Design", description: "Use CASE and conditional aggregation to build metrics with correct denominators.", estimatedMinutes: 55, prerequisiteSkills: ["Aggregations", "CASE"] },
    "da-new-m5": { id: "da-new-m5", sequence: 5, title: "Funnel Analysis", description: "Measure stage-by-stage conversion using distinct users and analytical interpretation.", estimatedMinutes: 70, prerequisiteSkills: ["CASE", "Aggregations"] },
    "da-new-m6": { id: "da-new-m6", sequence: 6, title: "Product Adoption", description: "Analyze product usage by joining product catalog data to active customer accounts.", estimatedMinutes: 45, prerequisiteSkills: ["JOINs"] },
    "da-new-m7": { id: "da-new-m7", sequence: 7, title: "Reporting Datasets and Targets", description: "Build branch-month actuals and compare them to targets at matching grain.", estimatedMinutes: 75, prerequisiteSkills: ["CTEs", "Period Comparison"] },
    "da-new-m8": { id: "da-new-m8", sequence: 8, title: "Analytical Investigation Capstone", description: "Investigate engagement by choosing metrics, joining data, and communicating evidence.", estimatedMinutes: 90, prerequisiteSkills: ["Trend Analysis", "JOINs", "Analytical Interpretation"] },
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
  stages?: LessonStageDefinition[],
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
    stages,
  };
}

function completedChallengeIds(progressRows: ProgressRow[]) {
  return new Set(progressRows.filter((row) => row.status === "completed").map((row) => row.challenge_id));
}

function stage(
  lessonId: string,
  type: LessonStageType,
  sequence: number,
  title: string,
  instructions: string,
  estimatedMinutes: number,
  challengeId?: number,
  starterSql?: string,
  hints: string[] = [],
  carryForwardQuery = false,
): LessonStageDefinition {
  return {
    id: `${lessonId}-stage-${sequence}`,
    lessonId,
    sequence,
    type,
    title,
    instructions,
    estimatedMinutes,
    challengeId,
    starterSql,
    hints,
    carryForwardQuery,
  };
}

function lessonChallengeIds(lesson: LessonDefinition) {
  const stageIds = getLessonStages(lesson)
    .map((stage) => stage.challengeId)
    .filter((challengeId): challengeId is number => typeof challengeId === "number");
  return stageIds.length ? stageIds : [lesson.challengeId];
}

function isLessonCompleted(lesson: LessonDefinition, completed: Set<number>) {
  if (completed.has(lesson.challengeId)) return true;
  const requiredChallengeIds = lessonChallengeIds(lesson);
  return requiredChallengeIds.length > 0 && requiredChallengeIds.every((challengeId) => completed.has(challengeId));
}

function clampIndex(index: number, count: number) {
  if (count <= 0) return 0;
  return Math.min(Math.max(index, 0), count - 1);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
