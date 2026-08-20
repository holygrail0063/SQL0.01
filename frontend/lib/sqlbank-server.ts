import alasql from "alasql/dist/alasql.min.js";

export type Challenge = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  topic: string;
  starter_sql: string;
  concept: string;
  lesson: string;
  example_sql: string;
  success_criteria: string[];
  guidance: Record<string, string>;
  reference_sql: string;
  comparison_mode: "ordered" | "unordered" | "single_value";
};

type Row = Record<string, string | number>;

const MAX_RESULT_ROWS = Number(process.env.MAX_RESULT_ROWS ?? 200);
const MAX_QUERY_LENGTH = Number(process.env.MAX_QUERY_LENGTH ?? 5000);

const schema = [
  {
    table: "Customers",
    columns: [
      { name: "CustomerID", type: "int" },
      { name: "FirstName", type: "nvarchar(50)" },
      { name: "LastName", type: "nvarchar(50)" },
      { name: "Province", type: "nvarchar(50)" },
      { name: "City", type: "nvarchar(80)" },
      { name: "DateOfBirth", type: "date" },
      { name: "CustomerSince", type: "date" },
    ],
  },
  {
    table: "Branches",
    columns: [
      { name: "BranchID", type: "int" },
      { name: "BranchName", type: "nvarchar(100)" },
      { name: "Province", type: "nvarchar(50)" },
      { name: "City", type: "nvarchar(80)" },
    ],
  },
  {
    table: "Applications",
    columns: [
      { name: "ApplicationID", type: "int" },
      { name: "CustomerID", type: "int" },
      { name: "BranchID", type: "int" },
      { name: "ApplicationDate", type: "date" },
      { name: "RequestedAmount", type: "decimal(12,2)" },
      { name: "Status", type: "nvarchar(20)" },
      { name: "RiskScore", type: "int" },
    ],
  },
  {
    table: "Loans",
    columns: [
      { name: "LoanID", type: "int" },
      { name: "CustomerID", type: "int" },
      { name: "BranchID", type: "int" },
      { name: "LoanAmount", type: "decimal(12,2)" },
      { name: "InterestRate", type: "decimal(5,2)" },
      { name: "StartDate", type: "date" },
      { name: "LoanStatus", type: "nvarchar(20)" },
    ],
  },
  {
    table: "Payments",
    columns: [
      { name: "PaymentID", type: "int" },
      { name: "LoanID", type: "int" },
      { name: "PaymentDate", type: "date" },
      { name: "Amount", type: "decimal(12,2)" },
      { name: "PaymentStatus", type: "nvarchar(20)" },
    ],
  },
];

const challenges: Challenge[] = [
  {
    id: 1,
    title: "Read A Table With SELECT",
    description: "Your team lead asks for a first look at the customer file before tomorrow's portfolio review. Return every column and every row from the Customers table.",
    difficulty: "Beginner",
    topic: "SELECT",
    starter_sql: "",
    concept: "SELECT is how you ask a database to return data. The star (*) means every available column. FROM tells SQL which table to read.",
    lesson: "A basic query has two jobs: choose columns with SELECT, then choose the table with FROM. SELECT * is useful while exploring, but in real reporting you usually name only the columns you need.",
    example_sql: "SELECT *\nFROM TableName;",
    success_criteria: ["Return all rows from Customers.", "Return every column.", "Use SELECT and FROM together."],
    guidance: {
      "Completely New": "Start with SELECT *, then add FROM Customers. Think of FROM as the source drawer where the data lives.",
      "Know the Basics": "Use the simplest full-table query. Do not filter or sort yet.",
      "Comfortable With SQL": "Keep it intentionally broad; this task checks your baseline table-read syntax.",
      "Interview Preparation": "Interviewers expect you to explain that SELECT chooses columns and FROM chooses the table.",
    },
    reference_sql: "SELECT * FROM Customers;",
    comparison_mode: "unordered",
  },
  {
    id: 2,
    title: "Choose Specific Columns",
    description: "Your manager wants a lighter customer extract for a slide deck. Return only CustomerID, FirstName, LastName, and Province from Customers.",
    difficulty: "Beginner",
    topic: "Columns",
    starter_sql: "",
    concept: "Instead of SELECT *, you can list exact columns. This makes reports easier to read and avoids moving unnecessary data.",
    lesson: "Column order matters in a result set. When a stakeholder asks for specific fields, put those fields after SELECT in the same order they requested.",
    example_sql: "SELECT ColumnA, ColumnB\nFROM TableName;",
    success_criteria: ["Return CustomerID, FirstName, LastName, and Province.", "Do not return extra columns.", "Read from Customers."],
    guidance: {
      "Completely New": "Replace the star with a comma-separated column list.",
      "Know the Basics": "Focus on exact column names and order.",
      "Comfortable With SQL": "Treat this as a projection task: fewer columns, same rows.",
      "Interview Preparation": "Be ready to explain why SELECT * can be risky in production reports.",
    },
    reference_sql: "SELECT CustomerID, FirstName, LastName, Province FROM Customers;",
    comparison_mode: "unordered",
  },
  {
    id: 3,
    title: "Filter Rows With WHERE",
    description: "Your analytics lead is checking regional customer coverage. Return all Customers who live in Ontario.",
    difficulty: "Beginner",
    topic: "WHERE",
    starter_sql: "",
    concept: "WHERE filters rows. It keeps only records where a condition is true.",
    lesson: "Text values need quotes in SQL. A condition like Province = 'Ontario' keeps Ontario rows and removes the rest from the result.",
    example_sql: "SELECT *\nFROM TableName\nWHERE ColumnName = 'Value';",
    success_criteria: ["Return Customers rows only.", "Keep only Province equal to Ontario.", "Return every customer column."],
    guidance: {
      "Completely New": "Write a normal SELECT * query, then add WHERE Province = 'Ontario'.",
      "Know the Basics": "Remember quotes around Ontario because it is text.",
      "Comfortable With SQL": "This is a simple equality predicate.",
      "Interview Preparation": "Mention that WHERE runs before sorting and grouping in logical query processing.",
    },
    reference_sql: "SELECT * FROM Customers WHERE Province = 'Ontario';",
    comparison_mode: "unordered",
  },
  {
    id: 4,
    title: "Combine Conditions",
    description: "Your team lead needs a Toronto-only subset for an Ontario branch analysis. Return Ontario customers whose City is Toronto.",
    difficulty: "Beginner",
    topic: "AND",
    starter_sql: "",
    concept: "AND combines conditions. A row must satisfy every AND condition to appear.",
    lesson: "Use AND when a business request narrows the data in more than one way, such as Province and City at the same time.",
    example_sql: "SELECT *\nFROM TableName\nWHERE ColumnA = 'Value'\n  AND ColumnB = 'Value';",
    success_criteria: ["Read from Customers.", "Keep Province equal to Ontario.", "Keep City equal to Toronto."],
    guidance: {
      "Completely New": "Add one condition for Province and one for City. Put AND between them.",
      "Know the Basics": "Both text comparisons need quoted values.",
      "Comfortable With SQL": "This is a conjunctive filter.",
      "Interview Preparation": "Practice saying AND narrows the result because both predicates must be true.",
    },
    reference_sql: "SELECT * FROM Customers WHERE Province = 'Ontario' AND City = 'Toronto';",
    comparison_mode: "unordered",
  },
  {
    id: 5,
    title: "Sort Results With ORDER BY",
    description: "Your lending manager wants to review the largest exposures first. Return all Loans sorted from highest LoanAmount to lowest.",
    difficulty: "Beginner",
    topic: "ORDER BY",
    starter_sql: "",
    concept: "ORDER BY controls result order. DESC means descending, or largest to smallest for numbers.",
    lesson: "Without ORDER BY, databases do not promise row order. Use it whenever the sequence of rows matters to the user.",
    example_sql: "SELECT *\nFROM TableName\nORDER BY NumericColumn DESC;",
    success_criteria: ["Return all columns from Loans.", "Sort by LoanAmount.", "Largest loans must appear first."],
    guidance: {
      "Completely New": "Write SELECT * FROM Loans, then add ORDER BY LoanAmount DESC.",
      "Know the Basics": "DESC is the key word for highest to lowest.",
      "Comfortable With SQL": "Do not aggregate here; this is row-level sorting.",
      "Interview Preparation": "Remember ORDER BY is evaluated near the end of a SELECT query.",
    },
    reference_sql: "SELECT * FROM Loans ORDER BY LoanAmount DESC;",
    comparison_mode: "ordered",
  },
  {
    id: 6,
    title: "Limit A Ranked List",
    description: "Your manager only has time to inspect the ten largest loans. Return LoanID, LoanAmount, and InterestRate for the top 10 loans by LoanAmount.",
    difficulty: "Beginner",
    topic: "TOP",
    starter_sql: "",
    concept: "TOP limits how many rows come back. It is often paired with ORDER BY to create a ranked list.",
    lesson: "TOP without ORDER BY can be misleading because the database may choose any matching rows. For a top-10 business question, always define top by sorting.",
    example_sql: "SELECT TOP 10 ColumnA, ColumnB\nFROM TableName\nORDER BY NumericColumn DESC;",
    success_criteria: ["Return only 10 rows.", "Return LoanID, LoanAmount, and InterestRate.", "Sort by LoanAmount descending."],
    guidance: {
      "Completely New": "Put TOP 10 right after SELECT.",
      "Know the Basics": "The ORDER BY creates the ranking; TOP cuts it to 10 rows.",
      "Comfortable With SQL": "This is a common ranked-list report pattern.",
      "Interview Preparation": "Be ready to explain why TOP must be paired with ORDER BY for deterministic results.",
    },
    reference_sql: "SELECT TOP 10 LoanID, LoanAmount, InterestRate FROM Loans ORDER BY LoanAmount DESC;",
    comparison_mode: "ordered",
  },
  {
    id: 7,
    title: "Count Records",
    description: "Your operations manager asks how many loan applications SQLBank has received in the training data. Return one row with ApplicationCount.",
    difficulty: "Beginner",
    topic: "COUNT",
    starter_sql: "",
    concept: "COUNT(*) counts rows. It is the simplest aggregate because it turns many records into one number.",
    lesson: "Use aliases with AS to give calculated columns business-friendly names. ApplicationCount is easier to read than an unnamed count expression.",
    example_sql: "SELECT COUNT(*) AS RowCount\nFROM TableName;",
    success_criteria: ["Return a single value.", "Use COUNT(*).", "Name the output column ApplicationCount."],
    guidance: {
      "Completely New": "COUNT(*) means count all rows in the table.",
      "Know the Basics": "Use AS ApplicationCount to label the result.",
      "Comfortable With SQL": "No GROUP BY is needed because you want one total.",
      "Interview Preparation": "Know the difference between COUNT(*) and COUNT(ColumnName) when nulls are involved.",
    },
    reference_sql: "SELECT COUNT(*) AS ApplicationCount FROM Applications;",
    comparison_mode: "single_value",
  },
  {
    id: 8,
    title: "Group Rows Into Categories",
    description: "Your team lead wants a status breakdown for the application funnel. Return each Status with its application count.",
    difficulty: "Beginner",
    topic: "GROUP BY",
    starter_sql: "",
    concept: "GROUP BY creates one result row per category. Aggregates like COUNT(*) then calculate within each category.",
    lesson: "Every non-aggregated column in SELECT should appear in GROUP BY. Here, Status is the category and COUNT(*) is the metric.",
    example_sql: "SELECT CategoryColumn, COUNT(*) AS ItemCount\nFROM TableName\nGROUP BY CategoryColumn;",
    success_criteria: ["Return one row per Status.", "Count applications in each Status.", "Name the count ApplicationCount."],
    guidance: {
      "Completely New": "Put Status in SELECT and GROUP BY. Put COUNT(*) beside it.",
      "Know the Basics": "GROUP BY answers 'how many per category?' questions.",
      "Comfortable With SQL": "This is a dimensional aggregation.",
      "Interview Preparation": "Explain why Status must be grouped because it is not inside an aggregate.",
    },
    reference_sql: "SELECT Status, COUNT(*) AS ApplicationCount FROM Applications GROUP BY Status;",
    comparison_mode: "unordered",
  },
  {
    id: 9,
    title: "Summarize Numeric Columns",
    description: "Your branch performance manager needs lending totals and average rates by branch. Return BranchID, TotalLoanAmount, and AverageInterestRate from Loans.",
    difficulty: "Intermediate",
    topic: "SUM / AVG",
    starter_sql: "",
    concept: "SUM adds numeric values and AVG calculates the average. Both are aggregates and usually pair with GROUP BY.",
    lesson: "A branch-level metric requires grouping by BranchID. Then each branch receives its own total loan amount and average interest rate.",
    example_sql: "SELECT GroupColumn, SUM(NumberColumn) AS TotalValue, AVG(NumberColumn) AS AverageValue\nFROM TableName\nGROUP BY GroupColumn;",
    success_criteria: ["Group by BranchID.", "Calculate SUM(LoanAmount) as TotalLoanAmount.", "Calculate AVG(InterestRate) as AverageInterestRate."],
    guidance: {
      "Completely New": "Think 'one row per BranchID'. Everything else should be a calculation.",
      "Know the Basics": "Use two aggregate expressions in the same SELECT.",
      "Comfortable With SQL": "Watch your aliases; the checker expects the requested metric names.",
      "Interview Preparation": "This is a classic GROUP BY plus multiple aggregates question.",
    },
    reference_sql: "SELECT BranchID, SUM(LoanAmount) AS TotalLoanAmount, AVG(InterestRate) AS AverageInterestRate FROM Loans GROUP BY BranchID;",
    comparison_mode: "unordered",
  },
  {
    id: 10,
    title: "Join Loans To Customers",
    description: "Your servicing team lead needs customer names attached to loan records. Return LoanID, FirstName, LastName, and LoanAmount for every loan.",
    difficulty: "Intermediate",
    topic: "INNER JOIN",
    starter_sql: "",
    concept: "JOIN combines related tables. INNER JOIN keeps only records where the join condition matches on both sides.",
    lesson: "Loans has CustomerID, but names live in Customers. Join the tables on CustomerID to answer a question that needs columns from both tables.",
    example_sql: "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA a\nINNER JOIN TableB b ON a.SharedID = b.SharedID;",
    success_criteria: ["Use Loans and Customers.", "Join on CustomerID.", "Return LoanID, FirstName, LastName, and LoanAmount."],
    guidance: {
      "Completely New": "Use table aliases like l for Loans and c for Customers to keep the query readable.",
      "Know the Basics": "The ON clause explains how rows match between tables.",
      "Comfortable With SQL": "Select columns from both aliases after joining.",
      "Interview Preparation": "Be ready to define INNER JOIN as returning only matched rows.",
    },
    reference_sql: "SELECT l.LoanID, c.FirstName, c.LastName, l.LoanAmount FROM Loans l INNER JOIN Customers c ON l.CustomerID = c.CustomerID;",
    comparison_mode: "unordered",
  },
  {
    id: 11,
    title: "Join Before Grouping",
    description: "Your analytics manager wants provincial lending totals. Return Province and TotalLoanAmount by joining Loans to Branches.",
    difficulty: "Intermediate",
    topic: "JOIN + GROUP BY",
    starter_sql: "",
    concept: "Many real reports join tables first, then aggregate. The join adds the category you want to group by.",
    lesson: "Loan amounts live in Loans, while Province lives in Branches. Join on BranchID, then group by Province and sum LoanAmount.",
    example_sql: "SELECT b.Category, SUM(a.Amount) AS TotalAmount\nFROM FactTable a\nINNER JOIN LookupTable b ON a.LookupID = b.LookupID\nGROUP BY b.Category;",
    success_criteria: ["Join Loans to Branches on BranchID.", "Group by Branches.Province.", "Return SUM(LoanAmount) as TotalLoanAmount."],
    guidance: {
      "Completely New": "The join brings Province onto each loan row before you add totals.",
      "Know the Basics": "Use GROUP BY b.Province because Province is the category.",
      "Comfortable With SQL": "Think fact table plus dimension table.",
      "Interview Preparation": "This tests whether you can combine joins and aggregations in the right order.",
    },
    reference_sql: "SELECT b.Province, SUM(l.LoanAmount) AS TotalLoanAmount FROM Loans l INNER JOIN Branches b ON l.BranchID = b.BranchID GROUP BY b.Province;",
    comparison_mode: "unordered",
  },
  {
    id: 12,
    title: "Create Business Labels With CASE",
    description: "Your manager wants every loan labeled by size for a portfolio review. Return LoanID, LoanAmount, and LoanSize using Small, Medium, and Large.",
    difficulty: "Intermediate",
    topic: "CASE",
    starter_sql: "",
    concept: "CASE creates conditional labels. It is SQL's way to say: if this condition is true, return this value.",
    lesson: "Use CASE when a stakeholder wants categories that are not already stored in the table. Here, loan size is derived from LoanAmount.",
    example_sql: "SELECT ColumnA,\n  CASE\n    WHEN NumberColumn < 100 THEN 'Small'\n    ELSE 'Large'\n  END AS LabelName\nFROM TableName;",
    success_criteria: ["Small means LoanAmount less than 5000.", "Medium means LoanAmount from 5000 to less than 15000.", "Large means LoanAmount 15000 or more."],
    guidance: {
      "Completely New": "CASE starts with CASE, uses WHEN conditions, and ends with END AS LoanSize.",
      "Know the Basics": "Order matters: check Small before Medium before Large.",
      "Comfortable With SQL": "Make sure boundaries do not overlap.",
      "Interview Preparation": "CASE questions often test condition order and edge cases.",
    },
    reference_sql: "SELECT LoanID, LoanAmount, CASE WHEN LoanAmount < 5000 THEN 'Small' WHEN LoanAmount < 15000 THEN 'Medium' ELSE 'Large' END AS LoanSize FROM Loans;",
    comparison_mode: "unordered",
  },
  {
    id: 13,
    title: "Filter By Dates",
    description: "Your customer growth manager asks for newer relationships. Return all Customers whose CustomerSince date is on or after 2022-01-01.",
    difficulty: "Intermediate",
    topic: "Date Filters",
    starter_sql: "",
    concept: "Date filters work like numeric filters when dates are stored in a sortable format. Greater than or equal keeps dates on or after a cutoff.",
    lesson: "Business teams often ask for recent customers, recent applications, or recent payments. The pattern is a WHERE clause against a date column.",
    example_sql: "SELECT *\nFROM TableName\nWHERE DateColumn >= '2022-01-01';",
    success_criteria: ["Read from Customers.", "Filter CustomerSince on or after 2022-01-01.", "Return all customer columns."],
    guidance: {
      "Completely New": "Use >= to include the cutoff date itself.",
      "Know the Basics": "Dates should be quoted like text.",
      "Comfortable With SQL": "This is a range predicate with only a lower bound.",
      "Interview Preparation": "Be careful with inclusive and exclusive date boundaries.",
    },
    reference_sql: "SELECT * FROM Customers WHERE CustomerSince >= '2022-01-01';",
    comparison_mode: "unordered",
  },
  {
    id: 14,
    title: "Rank Aggregated Results",
    description: "Your regional director wants the busiest branches by application volume. Return the top 5 BranchName values with ApplicationCount.",
    difficulty: "Advanced",
    topic: "Ranking Aggregates",
    starter_sql: "",
    concept: "You can aggregate first and then sort the aggregated result. TOP can limit that sorted summary.",
    lesson: "This is a common analyst workflow: join to get readable branch names, group to count applications, order the counts, and return only the top rows.",
    example_sql: "SELECT TOP 5 b.Name, COUNT(*) AS ItemCount\nFROM DetailTable d\nINNER JOIN LookupTable b ON d.LookupID = b.LookupID\nGROUP BY b.Name\nORDER BY ItemCount DESC;",
    success_criteria: ["Join Applications to Branches.", "Count applications per BranchName.", "Return the five highest ApplicationCount values."],
    guidance: {
      "Completely New": "Build it in pieces: join first, group second, sort third, TOP last.",
      "Know the Basics": "The ORDER BY should use the count alias or COUNT(*) descending.",
      "Comfortable With SQL": "This is a leaderboard query.",
      "Interview Preparation": "Practice explaining the logical order: FROM/JOIN, GROUP BY, SELECT, ORDER BY, TOP.",
    },
    reference_sql: "SELECT TOP 5 b.BranchName, COUNT(*) AS ApplicationCount FROM Applications a INNER JOIN Branches b ON a.BranchID = b.BranchID GROUP BY b.BranchName ORDER BY ApplicationCount DESC, b.BranchName ASC;",
    comparison_mode: "ordered",
  },
  {
    id: 15,
    title: "Branch Approval Rate",
    description: "Your manager is preparing an executive update and needs the five branches with the highest application approval rate. Return BranchName and ApprovalRate.",
    difficulty: "Advanced",
    topic: "Business Analysis",
    starter_sql: "",
    concept: "Approval rate is a calculated business metric: approved applications divided by total applications. CASE helps count only approved rows inside the calculation.",
    lesson: "This task combines the full course: join for branch names, CASE for approved counts, aggregate for totals, calculate a percentage, sort the metric, and limit to the top five.",
    example_sql: "SELECT TOP 5 GroupName,\n  ROUND(SUM(CASE WHEN Status = 'Approved' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS ApprovalRate\nFROM TableName\nGROUP BY GroupName\nORDER BY ApprovalRate DESC;",
    success_criteria: ["Join Applications to Branches.", "Calculate approved applications divided by all applications.", "Return the top five branches by ApprovalRate."],
    guidance: {
      "Completely New": "This is a capstone. Use the example pattern and replace table and column names carefully.",
      "Know the Basics": "CASE creates 1 for approved rows and 0 for every other row.",
      "Comfortable With SQL": "Use ROUND to make the percentage readable.",
      "Interview Preparation": "This is the kind of multi-concept analytics query that appears in SQL job screens.",
    },
    reference_sql: "SELECT TOP 5 b.BranchName, ROUND(SUM(CASE WHEN a.Status = 'Approved' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS ApprovalRate FROM Branches b INNER JOIN Applications a ON b.BranchID = a.BranchID GROUP BY b.BranchName ORDER BY ApprovalRate DESC, b.BranchName ASC;",
    comparison_mode: "ordered",
  },
];

const prohibitedKeywords = new Set([
  "ALTER",
  "BACKUP",
  "CREATE",
  "DBCC",
  "DELETE",
  "DROP",
  "EXEC",
  "EXECUTE",
  "GRANT",
  "INSERT",
  "MERGE",
  "RESTORE",
  "REVOKE",
  "TRUNCATE",
  "UPDATE",
  "USE",
]);

let databaseReady = false;

export function listChallenges() {
  return challenges.map(({ reference_sql, comparison_mode, ...challenge }) => challenge);
}

export function getSchema() {
  return schema;
}

export function runSqlBankQuery(challengeId: number, query: string) {
  const challenge = challenges.find((candidate) => candidate.id === challengeId);
  if (!challenge) {
    return { status: 404, body: { detail: "Challenge not found" } };
  }

  let validated: string;
  try {
    validated = validateReadOnlyQuery(query);
  } catch (error) {
    return {
      status: 200,
      body: { success: false, correct: false, errorType: "validation_error", message: error instanceof Error ? error.message : "Invalid SQL query." },
    };
  }

  try {
    const startedAt = performance.now();
    ensureDatabase();
    const userResult = execute(validated);
    const referenceResult = execute(challenge.reference_sql);
    const correct = compareRows(userResult.rows, referenceResult.rows, challenge.comparison_mode);
    const displayRows = userResult.rows.slice(0, MAX_RESULT_ROWS);

    return {
      status: 200,
      body: {
        success: true,
        correct,
        columns: userResult.columns,
        rows: displayRows,
        executionTimeMs: Math.max(0, Math.round(performance.now() - startedAt)),
        truncated: userResult.rows.length > MAX_RESULT_ROWS,
        rowCount: displayRows.length,
        message: correct ? null : "Not quite. Your query ran successfully, but the result does not match the expected result.",
      },
    };
  } catch (error) {
    return {
      status: 200,
      body: {
        success: false,
        correct: false,
        errorType: "sql_error",
        message: error instanceof Error ? sanitizeSqlError(error.message) : "The query could not be completed.",
      },
    };
  }
}

function execute(sql: string) {
  const rows = alasql(normalizeSql(sql)) as Row[];
  const resultRows = Array.isArray(rows) ? rows : [];
  const columns = resultRows[0] ? Object.keys(resultRows[0]) : [];
  return {
    columns,
    rows: resultRows.map((row) => columns.map((column) => row[column] ?? null)),
  };
}

function ensureDatabase() {
  if (databaseReady) return;
  for (const table of schema) {
    alasql(`DROP TABLE IF EXISTS ${table.table}`);
    alasql(`CREATE TABLE ${table.table}`);
  }
  const data = createTrainingData();
  for (const [table, rows] of Object.entries(data)) {
    alasql.tables[table].data = rows;
  }
  databaseReady = true;
}

function createTrainingData() {
  const rng = createRng(1017);
  const provinces: Record<string, string[]> = {
    Ontario: ["Toronto", "Ottawa", "Hamilton", "London"],
    Quebec: ["Montreal", "Quebec City", "Laval"],
    "British Columbia": ["Vancouver", "Victoria", "Kelowna"],
    Alberta: ["Calgary", "Edmonton", "Red Deer"],
    Manitoba: ["Winnipeg", "Brandon"],
    "Nova Scotia": ["Halifax", "Dartmouth"],
    Saskatchewan: ["Regina", "Saskatoon"],
  };
  const firstNames = ["Maya", "Daniel", "Sofia", "Ethan", "Priya", "Noah", "Ava", "Liam", "Olivia", "Lucas", "Nora", "Arjun"];
  const lastNames = ["Chen", "Singh", "Martin", "Patel", "Brown", "Wilson", "Roy", "Nguyen", "Taylor", "Anderson", "Campbell", "Kaur"];
  const provinceNames = Object.keys(provinces);

  const Branches: Row[] = [];
  let branchId = 1;
  for (const province of provinceNames) {
    for (const city of provinces[province].slice(0, 3)) {
      if (branchId <= 20) {
        Branches.push({ BranchID: branchId, BranchName: `${city} Advisory Centre`, Province: province, City: city });
        branchId += 1;
      }
    }
  }
  while (Branches.length < 20) {
    const province = pick(rng, provinceNames);
    const city = pick(rng, provinces[province]);
    Branches.push({ BranchID: Branches.length + 1, BranchName: `${city} Service Hub ${Branches.length + 1}`, Province: province, City: city });
  }

  const Customers: Row[] = [];
  for (let customerId = 1001; customerId <= 1500; customerId += 1) {
    const province = pick(rng, provinceNames);
    const city = pick(rng, provinces[province]);
    Customers.push({
      CustomerID: customerId,
      FirstName: pick(rng, firstNames),
      LastName: pick(rng, lastNames),
      Province: province,
      City: city,
      DateOfBirth: randomDate(rng, 1973, 2007),
      CustomerSince: randomDate(rng, 2014, 2023),
    });
  }

  const Applications: Row[] = [];
  const Loans: Row[] = [];
  let loanId = 5001;
  for (let applicationId = 2001; applicationId <= 3500; applicationId += 1) {
    const customer = pick(rng, Customers);
    const branch = pick(rng, Branches);
    const status = weightedPick(rng, ["Approved", "Declined", "Pending"], [56, 32, 12]);
    const requestedAmount = money(rng() * 43500 + 1500);
    Applications.push({
      ApplicationID: applicationId,
      CustomerID: customer.CustomerID,
      BranchID: branch.BranchID,
      ApplicationDate: randomDate(rng, 2021, 2025),
      RequestedAmount: requestedAmount,
      Status: status,
      RiskScore: Math.floor(rng() * 431) + 420,
    });
    if (status === "Approved" && Loans.length < 700) {
      Loans.push({
        LoanID: loanId,
        CustomerID: customer.CustomerID,
        BranchID: branch.BranchID,
        LoanAmount: requestedAmount,
        InterestRate: money(rng() * 10 + 4.5),
        StartDate: randomDate(rng, 2021, 2026),
        LoanStatus: weightedPick(rng, ["Active", "Paid", "Delinquent", "Closed"], [48, 28, 9, 15]),
      });
      loanId += 1;
    }
  }

  while (Loans.length < 700) {
    const customer = pick(rng, Customers);
    const branch = pick(rng, Branches);
    Loans.push({
      LoanID: loanId,
      CustomerID: customer.CustomerID,
      BranchID: branch.BranchID,
      LoanAmount: money(rng() * 43500 + 1500),
      InterestRate: money(rng() * 10 + 4.5),
      StartDate: randomDate(rng, 2021, 2026),
      LoanStatus: "Active",
    });
    loanId += 1;
  }

  const Payments: Row[] = [];
  for (let paymentId = 9001; paymentId <= 14000; paymentId += 1) {
    const loan = pick(rng, Loans);
    Payments.push({
      PaymentID: paymentId,
      LoanID: loan.LoanID,
      PaymentDate: randomDate(rng, 2022, 2026),
      Amount: money(Number(loan.LoanAmount) / (Math.floor(rng() * 29) + 8)),
      PaymentStatus: weightedPick(rng, ["Completed", "Late", "Missed", "Reversed"], [82, 10, 6, 2]),
    });
  }

  return { Customers, Branches, Applications, Loans, Payments };
}

function validateReadOnlyQuery(query: string) {
  const stripped = query.trim();
  if (!stripped) throw new Error("Enter a SQL query before running it.");
  if (stripped.length > MAX_QUERY_LENGTH) throw new Error(`Query is too long. Keep it under ${MAX_QUERY_LENGTH} characters.`);

  const withoutComments = stripComments(stripped);
  if (hasMultipleStatements(withoutComments)) throw new Error("Only one read-only SQL statement can be executed at a time.");
  const firstKeyword = withoutComments.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/)?.[0]?.toUpperCase();
  if (!["SELECT", "WITH"].includes(firstKeyword ?? "")) throw new Error("Only SELECT queries and read-only CTE queries are allowed.");

  const tokens = new Set(stripStringLiterals(withoutComments).toUpperCase().match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) ?? []);
  for (const keyword of prohibitedKeywords) {
    if (tokens.has(keyword)) throw new Error(`Prohibited SQL keyword detected: ${keyword}.`);
  }
  return stripped.replace(/;+\s*$/, "");
}

function normalizeSql(sql: string) {
  return sql.replace(/\bCAST\s*\(([\S\s]*?)\s+AS\s+DECIMAL\s*\(\s*\d+\s*,\s*\d+\s*\)\s*\)/gi, "ROUND($1, 2)");
}

function compareRows(userRows: unknown[][], referenceRows: unknown[][], mode: Challenge["comparison_mode"]) {
  if (mode === "single_value") return normalizeValue(userRows[0]?.[0]) === normalizeValue(referenceRows[0]?.[0]);
  const user = userRows.map(normalizeRow);
  const reference = referenceRows.map(normalizeRow);
  if (mode === "ordered") return JSON.stringify(user) === JSON.stringify(reference);
  return JSON.stringify(user.sort()) === JSON.stringify(reference.sort());
}

function normalizeRow(row: unknown[]) {
  return row.map((value) => String(normalizeValue(value)));
}

function normalizeValue(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return Number(value.toFixed(4));
  return value;
}

function stripComments(sql: string) {
  return sql.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, " ");
}

function stripStringLiterals(sql: string) {
  return sql.replace(/'(?:''|[^'])*'|"(?:[""]|[^"])*"/g, "''");
}

function hasMultipleStatements(sql: string) {
  return sql.replace(/;+\s*$/, "").includes(";");
}

function sanitizeSqlError(message: string) {
  return message.replace(/^Parse error on line \d+:\s*/i, "").slice(0, 500) || "The training database returned an error while running the query.";
}

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pick<T>(rng: () => number, values: T[]) {
  return values[Math.floor(rng() * values.length)];
}

function weightedPick<T>(rng: () => number, values: T[], weights: number[]) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = rng() * total;
  for (let index = 0; index < values.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return values[index];
  }
  return values[values.length - 1];
}

function randomDate(rng: () => number, startYear: number, endYear: number) {
  const start = Date.UTC(startYear, 0, 1);
  const end = Date.UTC(endYear, 11, 31);
  return new Date(start + rng() * (end - start)).toISOString().slice(0, 10);
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}
