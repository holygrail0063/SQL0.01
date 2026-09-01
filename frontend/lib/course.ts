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
  conceptId?: string;
  sourceChallengeId?: number;
  teachingKind?: "full" | "mini";
  reinforcement?: string;
};

export type SkillMastery = {
  skill: string;
  mastery: number;
};

export type ModuleProgress = {
  module: ModuleDefinition;
  completedLessons: number;
  totalLessons: number;
  completedQuestions: number;
  totalQuestions: number;
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
  {
    "id": "sql-foundations",
    "sequence": 1,
    "title": "SQL Foundations",
    "description": "Learn SELECT, column selection, and the first WHERE filters.",
    "estimatedMinutes": 50,
    "prerequisiteSkills": []
  },
  {
    "id": "filtering-data",
    "sequence": 2,
    "title": "Filtering Data",
    "description": "Use WHERE with AND, OR, IN, BETWEEN, LIKE, NULL checks, and sorting.",
    "estimatedMinutes": 50,
    "prerequisiteSkills": [
      "sql-foundations"
    ]
  },
  {
    "id": "sorting-basic-metrics",
    "sequence": 3,
    "title": "Sorting and Basic Metrics",
    "description": "Build ranked lists, distinct lists, aliases, and first aggregate metrics.",
    "estimatedMinutes": 50,
    "prerequisiteSkills": [
      "filtering-data"
    ]
  },
  {
    "id": "aggregation-grouping",
    "sequence": 4,
    "title": "Aggregation and Grouping",
    "description": "Summarize SQLBank data with COUNT, SUM, AVG, MIN, MAX, GROUP BY, and HAVING.",
    "estimatedMinutes": 50,
    "prerequisiteSkills": [
      "sorting-basic-metrics"
    ]
  },
  {
    "id": "grouping-joins",
    "sequence": 5,
    "title": "Grouping and Introduction to Joins",
    "description": "Attach names and product context using INNER JOINs.",
    "estimatedMinutes": 50,
    "prerequisiteSkills": [
      "aggregation-grouping"
    ]
  },
  {
    "id": "multi-table-sql",
    "sequence": 6,
    "title": "Multi-Table SQL",
    "description": "Combine multiple SQLBank tables and introduce LEFT JOIN patterns.",
    "estimatedMinutes": 50,
    "prerequisiteSkills": [
      "grouping-joins"
    ]
  },
  {
    "id": "case-logic",
    "sequence": 7,
    "title": "CASE Logic",
    "description": "Translate business rules into labels with CASE expressions.",
    "estimatedMinutes": 50,
    "prerequisiteSkills": [
      "multi-table-sql"
    ]
  },
  {
    "id": "business-logic-dates",
    "sequence": 8,
    "title": "Business Logic and Dates",
    "description": "Use date filters, conditional aggregation, and joined summary reports.",
    "estimatedMinutes": 50,
    "prerequisiteSkills": [
      "case-logic"
    ]
  },
  {
    "id": "analyst-reporting",
    "sequence": 9,
    "title": "Analyst Reporting",
    "description": "Answer KPI-style SQLBank requests with grouping, joins, and aggregation.",
    "estimatedMinutes": 50,
    "prerequisiteSkills": [
      "business-logic-dates"
    ]
  },
  {
    "id": "beginner-final-assignments",
    "sequence": 10,
    "title": "Beginner Final Assignments",
    "description": "Complete integrated analyst requests and Beginner capstones.",
    "estimatedMinutes": 50,
    "prerequisiteSkills": [
      "analyst-reporting"
    ]
  }
];

const MASTER_LESSONS: LessonDefinition[] = [
  lesson("beginner-q001", "sql-foundations", 1, 1, "Open the customer file", "exercise", 10, "foundation", ["select","from"], "Return every column and every row from Customers.", "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.", "Return every column and every row from Customers.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use SELECT for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q002", "sql-foundations", 2, 2, "Choose customer fields", "exercise", 10, "foundation", ["column-selection"], "Return CustomerID, FirstName, LastName, Province, and City from Customers.", "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.", "Return CustomerID, FirstName, LastName, Province, and City from Customers.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use Column selection for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q003", "sql-foundations", 3, 3, "Find Ontario customers", "exercise", 10, "foundation", ["where"], "Return every column for customers whose Province is Ontario.", "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.", "Return every column for customers whose Province is Ontario.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use WHERE for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q004", "sql-foundations", 4, 4, "Active Ontario customers", "exercise", 10, "foundation", ["where","and","order-by"], "Customer Operations needs active Ontario customers for a regional outreach list.\r", "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.", "Customer Operations needs active Ontario customers for a regional outreach list.\r\nReturn CustomerID, FirstName, LastName, City, CustomerSegment, and AcquisitionChannel.\r\nOnly include customers whose Province is Ontario and CustomerStatus is Active.\r\nOrder the results by CustomerID.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use WHERE for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q005", "sql-foundations", 5, 5, "Inspect the branch network", "exercise", 10, "foundation", ["select-columns"], "Return BranchID, BranchName, Province, and City for every branch.", "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.", "Return BranchID, BranchName, Province, and City for every branch.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use SELECT columns for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q006", "sql-foundations", 6, 6, "Inspect account balances", "exercise", 10, "foundation", ["select-columns"], "Return AccountID, CustomerID, AccountType, Balance, and AccountStatus from Accounts.", "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.", "Return AccountID, CustomerID, AccountType, Balance, and AccountStatus from Accounts.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use SELECT columns for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q007", "sql-foundations", 7, 7, "Toronto customers", "exercise", 10, "foundation", ["where"], "Return CustomerID, FirstName, LastName, and CustomerStatus for customers in Toronto.", "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.", "Return CustomerID, FirstName, LastName, and CustomerStatus for customers in Toronto.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use WHERE for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q008", "sql-foundations", 8, 8, "Active loans", "exercise", 10, "foundation", ["where"], "Return LoanID, CustomerID, LoanAmount, and InterestRate for loans whose LoanStatus is Active.", "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.", "Return LoanID, CustomerID, LoanAmount, and InterestRate for loans whose LoanStatus is Active.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use WHERE for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q009", "sql-foundations", 9, 9, "Large application requests", "exercise", 10, "foundation", ["numeric-comparison"], "Return applications where RequestedAmount is at least 25000.", "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.", "Return applications where RequestedAmount is at least 25000.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use Numeric comparison for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q010", "sql-foundations", 10, 10, "Higher risk-score applications", "review", 10, "foundation", ["numeric-comparison"], "Return ApplicationID, RequestedAmount, Status, and RiskScore for applications whose RiskScore is at least 700.", "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.", "Return ApplicationID, RequestedAmount, Status, and RiskScore for applications whose RiskScore is at least 700.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use Numeric comparison for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q011", "filtering-data", 1, 11, "Mobile transactions", "assignment", 10, "foundation", ["where"], "Return TransactionID, AccountID, TransactionType, Amount, and MerchantCategory for transactions where Channel is Mobile.", "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.", "Return TransactionID, AccountID, TransactionType, Amount, and MerchantCategory for transactions where Channel is Mobile.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use WHERE for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q012", "filtering-data", 2, 12, "Active Toronto customers", "assignment", 10, "foundation", ["and"], "Return CustomerID, FirstName, LastName, and CustomerSegment for active customers who live in Toronto.", "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.", "Return CustomerID, FirstName, LastName, and CustomerSegment for active customers who live in Toronto.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use AND for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q013", "filtering-data", 3, 13, "Alberta or British Columbia", "assignment", 10, "foundation", ["or"], "Return CustomerID, FirstName, LastName, Province, and City for customers whose Province is Alberta or British Columbia.", "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.", "Return CustomerID, FirstName, LastName, Province, and City for customers whose Province is Alberta or British Columbia.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use OR for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q014", "filtering-data", 4, 14, "Three-province customer list", "assignment", 10, "foundation", ["in"], "Return CustomerID, FirstName, LastName, and Province for customers in Ontario, Alberta, or Manitoba.", "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.", "Return CustomerID, FirstName, LastName, and Province for customers in Ontario, Alberta, or Manitoba.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use IN for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q015", "filtering-data", 5, 15, "Mid-size applications", "assignment", 10, "foundation", ["between"], "Return ApplicationID, CustomerID, RequestedAmount, and Status for applications with RequestedAmount between 10000 and 20000 inclusive.", "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.", "Return ApplicationID, CustomerID, RequestedAmount, and Status for applications with RequestedAmount between 10000 and 20000 inclusive.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use BETWEEN for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q016", "filtering-data", 6, 16, "Advisory Centre branches", "assignment", 10, "foundation", ["like"], "Return BranchID, BranchName, Province, and City for branches whose BranchName contains the text \"Advisory Centre\".", "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.", "Return BranchID, BranchName, Province, and City for branches whose BranchName contains the text \"Advisory Centre\".", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use LIKE for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q017", "filtering-data", 7, 17, "Names beginning with A", "assignment", 10, "foundation", ["like"], "Return CustomerID, FirstName, LastName, and Province for customers whose FirstName starts with A.", "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.", "Return CustomerID, FirstName, LastName, and Province for customers whose FirstName starts with A.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use LIKE for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q018", "filtering-data", 8, 18, "Accounts without a closure date", "assignment", 10, "foundation", ["is-null"], "Return AccountID, CustomerID, AccountType, OpenedDate, Balance, and AccountStatus for accounts where ClosedDate is NULL.", "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.", "Return AccountID, CustomerID, AccountType, OpenedDate, Balance, and AccountStatus for accounts where ClosedDate is NULL.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use IS NULL for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q019", "filtering-data", 9, 19, "Customers who are not closed", "assignment", 10, "foundation", ["inequality"], "Return CustomerID, FirstName, LastName, and CustomerStatus for customers whose CustomerStatus is not Closed.", "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.", "Return CustomerID, FirstName, LastName, and CustomerStatus for customers whose CustomerStatus is not Closed.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use Inequality for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q020", "filtering-data", 10, 20, "Largest loans first", "review", 10, "foundation", ["order-by-desc"], "Return all loans sorted from highest LoanAmount to lowest.", "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.", "Return all loans sorted from highest LoanAmount to lowest.", "What business decision or review would this result support?", ["Start from the table named in the request, then add the requested columns.","Use ORDER BY DESC for this question.","Match the requested filters, output columns, and ordering exactly."]),
  lesson("beginner-q021", "sorting-basic-metrics", 1, 21, "Top 10 loans", "assignment", 10, "foundation", ["top","order-by"], "Return LoanID, CustomerID, LoanAmount, and InterestRate for the 10 largest loans.", "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.", "Return LoanID, CustomerID, LoanAmount, and InterestRate for the 10 largest loans.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested TOP pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q022", "sorting-basic-metrics", 2, 22, "Top five account balances", "assignment", 10, "foundation", ["top","order-by"], "Return AccountID, CustomerID, AccountType, and Balance for the five highest account balances.", "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.", "Return AccountID, CustomerID, AccountType, and Balance for the five highest account balances.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested TOP pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q023", "sorting-basic-metrics", 3, 23, "Lowest risk scores first", "assignment", 10, "foundation", ["order-by-asc"], "Return ApplicationID, CustomerID, RequestedAmount, and RiskScore ordered from lowest RiskScore to highest.", "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.", "Return ApplicationID, CustomerID, RequestedAmount, and RiskScore ordered from lowest RiskScore to highest.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested ORDER BY ASC pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q024", "sorting-basic-metrics", 4, 24, "Unique provinces", "assignment", 10, "foundation", ["distinct","order-by"], "Return a list of unique provinces found in the Customers table.\r", "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.", "Return a list of unique provinces found in the Customers table.\r\nSort the provinces alphabetically.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested DISTINCT pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q025", "sorting-basic-metrics", 5, 25, "Unique merchant categories", "assignment", 10, "foundation", ["distinct","order-by"], "Return each unique MerchantCategory from Transactions in alphabetical order.", "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.", "Return each unique MerchantCategory from Transactions in alphabetical order.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested DISTINCT pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q026", "sorting-basic-metrics", 6, 26, "Create readable aliases", "assignment", 10, "foundation", ["aliases"], "Return:\r", "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.", "Return:\r\n- CustomerID as CustomerNumber\r\n- FirstName as GivenName\r\n- LastName as FamilyName\r\n- Province", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested Aliases pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q027", "sorting-basic-metrics", 7, 27, "Most recent applications", "assignment", 10, "foundation", ["top","multi-column-order-by"], "Return the 10 most recent applications with ApplicationID, CustomerID, ApplicationDate, RequestedAmount, and Status.", "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.", "Return the 10 most recent applications with ApplicationID, CustomerID, ApplicationDate, RequestedAmount, and Status.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested TOP pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q028", "sorting-basic-metrics", 8, 28, "Count SQLBank customers", "assignment", 10, "foundation", ["count"], "Return one value named CustomerCount containing the total number of rows in Customers.", "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.", "Return one value named CustomerCount containing the total number of rows in Customers.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested COUNT pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q029", "sorting-basic-metrics", 9, 29, "Count active customers", "assignment", 10, "foundation", ["count","where"], "Return one value named ActiveCustomerCount containing the number of customers whose CustomerStatus is Active.", "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.", "Return one value named ActiveCustomerCount containing the number of customers whose CustomerStatus is Active.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested COUNT pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q030", "sorting-basic-metrics", 10, 30, "Total loan portfolio", "review", 10, "foundation", ["sum"], "Return the total LoanAmount across all loans as TotalLoanAmount.", "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.", "Return the total LoanAmount across all loans as TotalLoanAmount.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested SUM pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q031", "aggregation-grouping", 1, 31, "Average loan interest rate", "assignment", 10, "foundation", ["avg"], "Return the average InterestRate across all loans as AverageInterestRate.", "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.", "Return the average InterestRate across all loans as AverageInterestRate.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested AVG pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q032", "aggregation-grouping", 2, 32, "Smallest and largest requested amount", "assignment", 10, "foundation", ["min","max"], "Return:\r", "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.", "Return:\r\n- minimum RequestedAmount as MinimumRequestedAmount\r\n- maximum RequestedAmount as MaximumRequestedAmount", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested MIN pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q033", "aggregation-grouping", 3, 33, "Total completed payment amount", "assignment", 10, "foundation", ["sum","where"], "Return the sum of Amount for payments whose PaymentStatus is Completed.\r", "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.", "Return the sum of Amount for payments whose PaymentStatus is Completed.\r\nName the result CompletedPaymentAmount.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested SUM pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q034", "aggregation-grouping", 4, 34, "Count failed transactions", "assignment", 10, "foundation", ["count","where"], "Return the number of failed transactions as FailedTransactionCount.", "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.", "Return the number of failed transactions as FailedTransactionCount.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested COUNT pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q035", "aggregation-grouping", 5, 35, "Total campaign spend", "assignment", 10, "foundation", ["sum"], "Return the sum of CampaignCost across Campaigns as TotalCampaignCost.", "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.", "Return the sum of CampaignCost across Campaigns as TotalCampaignCost.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested SUM pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q036", "aggregation-grouping", 6, 36, "Customers by province", "assignment", 10, "foundation", ["group-by","count"], "Return Province and CustomerCount for each province.\r", "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.", "Return Province and CustomerCount for each province.\r\nOrder from the highest CustomerCount to lowest.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested GROUP BY pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q037", "aggregation-grouping", 7, 37, "Applications by status", "assignment", 10, "foundation", ["group-by","count"], "Return Status and ApplicationCount for each application status.", "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.", "Return Status and ApplicationCount for each application status.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested GROUP BY pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q038", "aggregation-grouping", 8, 38, "Accounts by type", "assignment", 10, "foundation", ["group-by","count"], "Return AccountType and AccountCount for each account type.", "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.", "Return AccountType and AccountCount for each account type.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested GROUP BY pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q039", "aggregation-grouping", 9, 39, "Transactions by channel", "assignment", 10, "foundation", ["group-by","count"], "Return Channel and TransactionCount for each transaction channel.", "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.", "Return Channel and TransactionCount for each transaction channel.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested GROUP BY pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q040", "aggregation-grouping", 10, 40, "Transaction value by type", "review", 10, "foundation", ["group-by","count","sum"], "Return TransactionType, TransactionCount, and TotalAmount for each transaction type.", "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.", "Return TransactionType, TransactionCount, and TotalAmount for each transaction type.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested GROUP BY pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q041", "grouping-joins", 1, 41, "Average requested amount by status", "assignment", 12, "intermediate", ["group-by","avg"], "Return Status and AverageRequestedAmount for each application status.", "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.", "Return Status and AverageRequestedAmount for each application status.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested GROUP BY pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q042", "grouping-joins", 2, 42, "Provinces with more than 50 customers", "assignment", 12, "intermediate", ["group-by","having"], "Return Province and CustomerCount only for provinces containing more than 50 customers.", "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.", "Return Province and CustomerCount only for provinces containing more than 50 customers.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested GROUP BY pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q043", "grouping-joins", 3, 43, "Customer names on loans", "assignment", 12, "intermediate", ["inner-join"], "Return LoanID, FirstName, LastName, LoanAmount, and LoanStatus for every loan.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return LoanID, FirstName, LastName, LoanAmount, and LoanStatus for every loan.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested INNER JOIN pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q044", "grouping-joins", 4, 44, "Branch names on applications", "assignment", 12, "intermediate", ["inner-join"], "Return ApplicationID, BranchName, ApplicationDate, RequestedAmount, and Status.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return ApplicationID, BranchName, ApplicationDate, RequestedAmount, and Status.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested INNER JOIN pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q045", "grouping-joins", 5, 45, "Loan information on payments", "assignment", 12, "intermediate", ["inner-join"], "Return PaymentID, LoanID, LoanAmount, PaymentDate, Amount, and PaymentStatus.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return PaymentID, LoanID, LoanAmount, PaymentDate, Amount, and PaymentStatus.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested INNER JOIN pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q046", "grouping-joins", 6, 46, "Customer names on accounts", "assignment", 12, "intermediate", ["inner-join"], "Return AccountID, FirstName, LastName, AccountType, Balance, and AccountStatus.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return AccountID, FirstName, LastName, AccountType, Balance, and AccountStatus.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested INNER JOIN pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q047", "grouping-joins", 7, 47, "Product names on accounts", "assignment", 12, "intermediate", ["inner-join"], "Return AccountID, ProductName, ProductCategory, AccountType, Balance, and AccountStatus.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return AccountID, ProductName, ProductCategory, AccountType, Balance, and AccountStatus.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested INNER JOIN pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q048", "grouping-joins", 8, 48, "Product names on applications", "assignment", 12, "intermediate", ["inner-join"], "Return ApplicationID, ProductName, ProductCategory, RequestedAmount, and Status.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return ApplicationID, ProductName, ProductCategory, RequestedAmount, and Status.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested INNER JOIN pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q049", "grouping-joins", 9, 49, "Account type on transactions", "assignment", 12, "intermediate", ["inner-join"], "Return TransactionID, AccountType, TransactionType, Amount, Channel, and TransactionStatus.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return TransactionID, AccountType, TransactionType, Amount, Channel, and TransactionStatus.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested INNER JOIN pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q050", "grouping-joins", 10, 50, "Customer names on events", "review", 12, "intermediate", ["inner-join"], "Return EventID, FirstName, LastName, EventName, Channel, and DeviceType.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return EventID, FirstName, LastName, EventName, Channel, and DeviceType.", "What business decision or review would this result support?", ["Identify the result grain before writing SELECT.","Use the requested INNER JOIN pattern and keep aliases readable.","Check whether the prompt asks for sorting or exact output column names."]),
  lesson("beginner-q051", "multi-table-sql", 1, 51, "Branch names on monthly targets", "assignment", 12, "intermediate", ["inner-join"], "Return Month, BranchName, ApplicationsTarget, ApprovalsTarget, and RevenueTarget.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return Month, BranchName, ApplicationsTarget, ApprovalsTarget, and RevenueTarget.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q052", "multi-table-sql", 2, 52, "Customer names on applications", "assignment", 12, "intermediate", ["inner-join"], "Return ApplicationID, FirstName, LastName, RequestedAmount, Status, and RiskScore.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return ApplicationID, FirstName, LastName, RequestedAmount, Status, and RiskScore.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q053", "multi-table-sql", 3, 53, "Three-table payment detail", "assignment", 12, "intermediate", ["three-table-inner-join"], "Return PaymentID, customer FirstName and LastName, LoanAmount, PaymentDate, Amount, and PaymentStatus.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return PaymentID, customer FirstName and LastName, LoanAmount, PaymentDate, Amount, and PaymentStatus.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q054", "multi-table-sql", 4, 54, "Application review file", "assignment", 12, "intermediate", ["three-table-join"], "Return ApplicationID, customer FirstName and LastName, BranchName, RequestedAmount, Status, and RiskScore.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return ApplicationID, customer FirstName and LastName, BranchName, RequestedAmount, Status, and RiskScore.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q055", "multi-table-sql", 5, 55, "Loan servicing file", "assignment", 12, "intermediate", ["three-table-join"], "Return LoanID, customer FirstName and LastName, BranchName, LoanAmount, InterestRate, and LoanStatus.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return LoanID, customer FirstName and LastName, BranchName, LoanAmount, InterestRate, and LoanStatus.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q056", "multi-table-sql", 6, 56, "Account product portfolio", "assignment", 12, "intermediate", ["three-table-join"], "Return AccountID, customer FirstName and LastName, ProductName, AccountType, Balance, and AccountStatus.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return AccountID, customer FirstName and LastName, ProductName, AccountType, Balance, and AccountStatus.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q057", "multi-table-sql", 7, 57, "Customer transaction detail", "assignment", 12, "intermediate", ["three-table-join"], "Return TransactionID, customer FirstName and LastName, AccountType, TransactionType, Amount, Channel, and TransactionStatus.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return TransactionID, customer FirstName and LastName, AccountType, TransactionType, Amount, Channel, and TransactionStatus.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q058", "multi-table-sql", 8, 58, "Events with missing products preserved", "assignment", 12, "intermediate", ["left-join"], "Return EventID, EventName, ProductName, Channel, and DeviceType for every customer event, including events that do not have a ProductID.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return EventID, EventName, ProductName, Channel, and DeviceType for every customer event, including events that do not have a ProductID.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q059", "multi-table-sql", 9, 59, "Application count by branch", "assignment", 12, "intermediate", ["join","group-by"], "Return BranchName and ApplicationCount for every branch that has applications.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return BranchName and ApplicationCount for every branch that has applications.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q060", "multi-table-sql", 10, 60, "Approved applications by branch", "review", 12, "intermediate", ["join","where","group-by"], "Return BranchName and ApprovedApplicationCount for approved applications only.", "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.", "Return BranchName and ApprovedApplicationCount for approved applications only.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q061", "case-logic", 1, 61, "Total loan amount by branch", "assignment", 12, "intermediate", ["join","sum","group-by"], "Return BranchName and TotalLoanAmount for each branch.", "CASE expressions convert raw values into business labels directly in the query result.", "Return BranchName and TotalLoanAmount for each branch.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q062", "case-logic", 2, 62, "Completed payments by customer", "assignment", 12, "intermediate", ["three-table-join","sum"], "Return CustomerID, FirstName, LastName, and CompletedPaymentAmount for completed payments.", "CASE expressions convert raw values into business labels directly in the query result.", "Return CustomerID, FirstName, LastName, and CompletedPaymentAmount for completed payments.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q063", "case-logic", 3, 63, "Transaction amount by customer", "assignment", 12, "intermediate", ["three-table-join","sum"], "Return CustomerID, FirstName, LastName, and TotalTransactionAmount for successful transactions.", "CASE expressions convert raw values into business labels directly in the query result.", "Return CustomerID, FirstName, LastName, and TotalTransactionAmount for successful transactions.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q064", "case-logic", 4, 64, "Total account balance by customer", "assignment", 12, "intermediate", ["join","sum"], "Return CustomerID, FirstName, LastName, and TotalBalance across each customer's accounts.", "CASE expressions convert raw values into business labels directly in the query result.", "Return CustomerID, FirstName, LastName, and TotalBalance across each customer's accounts.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q065", "case-logic", 5, 65, "Customers with no loans", "assignment", 12, "intermediate", ["left-join","is-null"], "Return CustomerID, FirstName, LastName, and Province for customers who do not have a matching loan.", "CASE expressions convert raw values into business labels directly in the query result.", "Return CustomerID, FirstName, LastName, and Province for customers who do not have a matching loan.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q066", "case-logic", 6, 66, "Application size bands", "assignment", 12, "intermediate", ["case"], "Return ApplicationID, RequestedAmount, and AmountBand.\r", "CASE expressions convert raw values into business labels directly in the query result.", "Return ApplicationID, RequestedAmount, and AmountBand.\r\nUse:\r\n- below 10000 = Small\r\n- below 25000 = Medium\r\n- everything else = Large", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q067", "case-logic", 7, 67, "Risk-score bands", "assignment", 12, "intermediate", ["case"], "Return ApplicationID, RiskScore, and RiskBand.\r", "CASE expressions convert raw values into business labels directly in the query result.", "Return ApplicationID, RiskScore, and RiskBand.\r\nUse:\r\n- below 600 = Review\r\n- below 700 = Standard\r\n- 700 or higher = Strong", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q068", "case-logic", 8, 68, "Simplify loan status", "assignment", 12, "intermediate", ["case","in"], "Return LoanID, LoanStatus, and PortfolioGroup.\r", "CASE expressions convert raw values into business labels directly in the query result.", "Return LoanID, LoanStatus, and PortfolioGroup.\r\nActive and Delinquent loans should be labelled Open Portfolio.\r\nAll other statuses should be labelled Closed Portfolio.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q069", "case-logic", 9, 69, "Payment health", "assignment", 12, "intermediate", ["case"], "Return PaymentID, PaymentStatus, and PaymentHealth.\r", "CASE expressions convert raw values into business labels directly in the query result.", "Return PaymentID, PaymentStatus, and PaymentHealth.\r\nUse:\r\n- Completed = Healthy\r\n- Late = Watch\r\n- everything else = Action Required", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q070", "case-logic", 10, 70, "Open and closed accounts", "review", 12, "intermediate", ["case","null"], "Return AccountID, ClosedDate, and ClosureState.\r", "CASE expressions convert raw values into business labels directly in the query result.", "Return AccountID, ClosedDate, and ClosureState.\r\nIf ClosedDate is NULL, label the account Open.\r\nOtherwise label it Closed.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q071", "business-logic-dates", 1, 71, "Product context on events", "assignment", 14, "intermediate", ["case","null"], "Return EventID, EventName, ProductID, and ProductContext.\r", "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.", "Return EventID, EventName, ProductID, and ProductContext.\r\nIf ProductID is NULL, use No Product.\r\nOtherwise use Product Linked.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q072", "business-logic-dates", 2, 72, "Applications created in 2025", "assignment", 14, "intermediate", ["date-range"], "Return ApplicationID, CustomerID, ApplicationDate, RequestedAmount, and Status for applications created during 2025.", "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.", "Return ApplicationID, CustomerID, ApplicationDate, RequestedAmount, and Status for applications created during 2025.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q073", "business-logic-dates", 3, 73, "Loans started in 2025", "assignment", 14, "intermediate", ["date-range"], "Return LoanID, CustomerID, StartDate, LoanAmount, and LoanStatus for loans started during 2025.", "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.", "Return LoanID, CustomerID, StartDate, LoanAmount, and LoanStatus for loans started during 2025.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q074", "business-logic-dates", 4, 74, "Payments made in 2026", "assignment", 14, "intermediate", ["date-range"], "Return PaymentID, LoanID, PaymentDate, Amount, and PaymentStatus for payments made during 2026.", "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.", "Return PaymentID, LoanID, PaymentDate, Amount, and PaymentStatus for payments made during 2026.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q075", "business-logic-dates", 5, 75, "Q1 2026 transactions", "assignment", 14, "intermediate", ["date-range"], "Return TransactionID, AccountID, TransactionDate, TransactionType, Amount, and Channel for transactions from January through March 2026.", "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.", "Return TransactionID, AccountID, TransactionDate, TransactionType, Amount, and Channel for transactions from January through March 2026.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q076", "business-logic-dates", 6, 76, "Long-standing customers", "assignment", 14, "advanced", ["date-comparison"], "Return CustomerID, FirstName, LastName, and CustomerSince for customers who joined before 2020-01-01.", "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.", "Return CustomerID, FirstName, LastName, and CustomerSince for customers who joined before 2020-01-01.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q077", "business-logic-dates", 7, 77, "Campaigns active on a date", "assignment", 14, "advanced", ["date-overlap-logic"], "Return CampaignID, CampaignName, StartDate, EndDate, and Channel for campaigns that were active on June 15, 2025.", "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.", "Return CampaignID, CampaignName, StartDate, EndDate, and Channel for campaigns that were active on June 15, 2025.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q078", "business-logic-dates", 8, 78, "Regional customer distribution", "assignment", 14, "advanced", ["conditional-aggregation"], "Return Province, CustomerCount, and ActiveCustomerCount.", "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.", "Return Province, CustomerCount, and ActiveCustomerCount.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q079", "business-logic-dates", 9, 79, "Account status by type", "assignment", 14, "advanced", ["conditional-aggregation"], "Return AccountType, AccountCount, and ActiveAccountCount.", "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.", "Return AccountType, AccountCount, and ActiveAccountCount.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q080", "business-logic-dates", 10, 80, "Branch lending summary", "review", 14, "advanced", ["join","multiple-aggregates"], "Return BranchName, LoanCount, TotalLoanAmount, and AverageInterestRate.", "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.", "Return BranchName, LoanCount, TotalLoanAmount, and AverageInterestRate.", "What business decision or review would this result support?", ["Map each requested output column to its source table or expression.","Build joins and grouping before refining the final SELECT list."]),
  lesson("beginner-q081", "analyst-reporting", 1, 81, "Completed payments by loan status", "assignment", 14, "advanced", ["join","where","sum","group-by"], "Return LoanStatus and CompletedPaymentAmount using completed payments only.", "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.", "Return LoanStatus and CompletedPaymentAmount using completed payments only.", "What business decision or review would this result support?", ["Keep the report grain aligned with the business request."]),
  lesson("beginner-q082", "analyst-reporting", 2, 82, "Applications by product", "assignment", 14, "advanced", ["join","group-by"], "Return ProductName and ApplicationCount.", "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.", "Return ProductName and ApplicationCount.", "What business decision or review would this result support?", ["Keep the report grain aligned with the business request."]),
  lesson("beginner-q083", "analyst-reporting", 3, 83, "Approved applications by product", "assignment", 14, "advanced", ["join","where","group-by"], "Return ProductName and ApprovedApplicationCount for approved applications only.", "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.", "Return ProductName and ApprovedApplicationCount for approved applications only.", "What business decision or review would this result support?", ["Keep the report grain aligned with the business request."]),
  lesson("beginner-q084", "analyst-reporting", 4, 84, "Transaction performance by channel", "assignment", 14, "advanced", ["where","group-by","count","sum"], "Return Channel, TransactionCount, and TotalTransactionAmount for successful transactions.", "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.", "Return Channel, TransactionCount, and TotalTransactionAmount for successful transactions.", "What business decision or review would this result support?", ["Keep the report grain aligned with the business request."]),
  lesson("beginner-q085", "analyst-reporting", 5, 85, "Merchant-category transaction value", "assignment", 14, "advanced", ["where","group-by","count","sum"], "Return MerchantCategory, TransactionCount, and TotalAmount for successful transactions.", "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.", "Return MerchantCategory, TransactionCount, and TotalAmount for successful transactions.", "What business decision or review would this result support?", ["Keep the report grain aligned with the business request."]),
  lesson("beginner-q086", "analyst-reporting", 6, 86, "Customer acquisition mix", "assignment", 14, "advanced", ["group-by"], "Return AcquisitionChannel and CustomerCount.", "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.", "Return AcquisitionChannel and CustomerCount.", "What business decision or review would this result support?", ["Keep the report grain aligned with the business request."]),
  lesson("beginner-q087", "analyst-reporting", 7, 87, "Balance by customer segment", "assignment", 14, "advanced", ["join","avg","group-by"], "Return CustomerSegment and AverageBalance using Customers joined to Accounts.", "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.", "Return CustomerSegment and AverageBalance using Customers joined to Accounts.", "What business decision or review would this result support?", ["Keep the report grain aligned with the business request."]),
  lesson("beginner-q088", "analyst-reporting", 8, 88, "Monthly company targets", "assignment", 14, "advanced", ["group-by","sum"], "Return Month, TotalApplicationsTarget, TotalApprovalsTarget, and TotalRevenueTarget across all branches.", "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.", "Return Month, TotalApplicationsTarget, TotalApprovalsTarget, and TotalRevenueTarget across all branches.", "What business decision or review would this result support?", ["Keep the report grain aligned with the business request."]),
  lesson("beginner-q089", "analyst-reporting", 9, 89, "Branch approval rate", "assignment", 14, "advanced", ["join","conditional-aggregation","arithmetic"], "Return BranchName, ApplicationCount, ApprovedCount, and ApprovalRatePct.", "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.", "Return BranchName, ApplicationCount, ApprovedCount, and ApprovalRatePct.", "What business decision or review would this result support?", ["Keep the report grain aligned with the business request."]),
  lesson("beginner-q090", "analyst-reporting", 10, 90, "Approved requested amount by branch", "review", 14, "advanced", ["join","where","count","sum","group-by"], "Return BranchName, ApprovedApplicationCount, and ApprovedRequestedAmount for approved applications.", "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.", "Return BranchName, ApprovedApplicationCount, and ApprovedRequestedAmount for approved applications.", "What business decision or review would this result support?", ["Keep the report grain aligned with the business request."]),
  lesson("beginner-q091", "beginner-final-assignments", 1, 91, "Top customers by loan amount", "project", 18, "advanced", ["join","group-by","sum","top"], "SQLBank wants to identify its largest lending relationships.\r", "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.", "SQLBank wants to identify its largest lending relationships.\r\nReturn the 10 customers with the largest total LoanAmount.\r\nInclude:\r\n- CustomerID\r\n- FirstName\r\n- LastName\r\n- TotalLoanAmount", "What business decision or review would this result support?", ["Break the analyst request into output columns, source tables, filters, grouping, and ordering."]),
  lesson("beginner-q092", "beginner-final-assignments", 2, 92, "Customers with active accounts and loans", "project", 18, "advanced", ["three-table-join","where","distinct"], "Return distinct CustomerID, FirstName, and LastName for customers who have at least one active account and at least one active loan.", "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.", "Return distinct CustomerID, FirstName, and LastName for customers who have at least one active account and at least one active loan.", "What business decision or review would this result support?", ["Break the analyst request into output columns, source tables, filters, grouping, and ordering."]),
  lesson("beginner-q093", "beginner-final-assignments", 3, 93, "Completed payments by branch", "project", 18, "advanced", ["three-table-join","sum","where","group-by"], "Operations wants to understand how much completed payment value each branch is servicing.\r", "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.", "Operations wants to understand how much completed payment value each branch is servicing.\r\nReturn BranchName and CompletedPaymentAmount.\r\nOnly include completed payments.", "What business decision or review would this result support?", ["Break the analyst request into output columns, source tables, filters, grouping, and ordering."]),
  lesson("beginner-q094", "beginner-final-assignments", 4, 94, "Product account balances", "project", 18, "advanced", ["join","count","sum","group-by"], "Return ProductName, AccountCount, and TotalBalance for accounts associated with each product.", "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.", "Return ProductName, AccountCount, and TotalBalance for accounts associated with each product.", "What business decision or review would this result support?", ["Break the analyst request into output columns, source tables, filters, grouping, and ordering."]),
  lesson("beginner-q095", "beginner-final-assignments", 5, 95, "Transaction activity by customer segment", "project", 18, "advanced", ["three-table-join","group-by","count","sum"], "Return CustomerSegment, TransactionCount, and TotalTransactionAmount for successful transactions.", "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.", "Return CustomerSegment, TransactionCount, and TotalTransactionAmount for successful transactions.", "What business decision or review would this result support?", ["Break the analyst request into output columns, source tables, filters, grouping, and ordering."]),
  lesson("beginner-q096", "beginner-final-assignments", 6, 96, "Mobile activity by customer segment", "project", 18, "advanced", ["three-table-join","multiple-filters","group-by"], "Return CustomerSegment, TransactionCount, and TotalAmount for successful Mobile transactions.", "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.", "Return CustomerSegment, TransactionCount, and TotalAmount for successful Mobile transactions.", "What business decision or review would this result support?", ["Break the analyst request into output columns, source tables, filters, grouping, and ordering."]),
  lesson("beginner-q097", "beginner-final-assignments", 7, 97, "Annual branch targets", "project", 18, "advanced", ["join","multiple-sums","group-by"], "Return BranchName:\r", "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.", "Return BranchName:\r\n- AnnualApplicationsTarget\r\n- AnnualApprovalsTarget\r\n- AnnualRevenueTarget\r\n- AnnualCustomerGrowthTarget", "What business decision or review would this result support?", ["Break the analyst request into output columns, source tables, filters, grouping, and ordering."]),
  lesson("beginner-q098", "beginner-final-assignments", 8, 98, "Capstone: Branch payment health", "project", 18, "advanced", ["three-table-join","group-by","conditional-aggregation"], "Operations wants a payment-health report for every branch.\r", "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.", "Operations wants a payment-health report for every branch.\r\nReturn:\r\n- BranchName\r\n- PaymentCount\r\n- CompletedCount\r\n- LateCount\r\n- MissedCount\r\n- TotalPaymentAmount\r\nOrder branches by LateCount descending and then MissedCount descending.", "What business decision or review would this result support?", ["Break the analyst request into output columns, source tables, filters, grouping, and ordering."]),
  lesson("beginner-q099", "beginner-final-assignments", 9, 99, "Capstone: Product adoption portfolio", "project", 18, "advanced", ["join","group-by","conditional-aggregation"], "Product leadership wants to understand product adoption across SQLBank.\r", "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.", "Product leadership wants to understand product adoption across SQLBank.\r\nReturn:\r\n- ProductName\r\n- ProductCategory\r\n- AccountCount\r\n- ActiveAccountCount\r\n- TotalBalance", "What business decision or review would this result support?", ["Break the analyst request into output columns, source tables, filters, grouping, and ordering."]),
  lesson("beginner-q100", "beginner-final-assignments", 10, 100, "Final Beginner Capstone: Customer-segment activity", "project", 18, "advanced", ["three-table-join","where","group-by","count","sum","avg"], "Analytics wants a customer-segment view of successful transaction activity.\r", "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.", "Analytics wants a customer-segment view of successful transaction activity.\r\nReturn:\r\n- CustomerSegment\r\n- TransactionCount\r\n- TotalTransactionAmount\r\n- AverageTransactionAmount\r\nOrder the results by TotalTransactionAmount from highest to lowest.", "What business decision or review would this result support?", ["Break the analyst request into output columns, source tables, filters, grouping, and ordering."])
];

const INTERVIEW_LESSONS: LessonDefinition[] = [
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
    const moduleQuestionIds = module.lessons.flatMap(lessonChallengeIds);
    const completedQuestions = moduleQuestionIds.filter((challengeId) => completed.has(challengeId)).length;
    const totalQuestions = moduleQuestionIds.length;
    const completedLessons = module.lessons.filter((lessonDefinition) => isLessonCompleted(lessonDefinition, completed)).length;
    const totalLessons = module.lessons.length;
    const percent = totalQuestions ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
    const beforeStart = index < startIndex;
    const status: ModuleProgress["status"] =
      totalQuestions > 0 && completedQuestions === totalQuestions
        ? "Completed"
        : completedQuestions > 0
          ? "In Progress"
          : beforeStart || previousRecommendedComplete || index === startIndex
            ? "Available"
            : "Locked";
    if (!beforeStart) previousRecommendedComplete = status === "Completed";
    return { module, completedLessons, totalLessons, completedQuestions, totalQuestions, status, percent };
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
    .map((id) => INTERVIEW_LESSONS.find((lessonDefinition) => lessonDefinition.id === id))
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
