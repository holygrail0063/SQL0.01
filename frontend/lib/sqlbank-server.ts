import alasql from "alasql/dist/alasql.min.js";

export type Challenge = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  topic: string;
  starter_sql: string;
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
    title: "Basic SELECT",
    description: "Your SQLBank analytics manager needs a full customer extract. Query the Customers table and return every customer record.",
    difficulty: "Beginner",
    topic: "SELECT",
    starter_sql: "SELECT\nFROM Customers;",
    reference_sql: "SELECT * FROM Customers;",
    comparison_mode: "unordered",
  },
  {
    id: 2,
    title: "WHERE",
    description: "Your SQLBank analytics manager needs a list of customers located in Ontario. Query the Customers table and return the requested records.",
    difficulty: "Beginner",
    topic: "WHERE",
    starter_sql: "SELECT *\nFROM Customers\nWHERE ...;",
    reference_sql: "SELECT * FROM Customers WHERE Province = 'Ontario';",
    comparison_mode: "unordered",
  },
  {
    id: 3,
    title: "ORDER BY",
    description: "SQLBank wants to review its largest lending exposures first. Display all loans from the largest loan amount to the smallest loan amount.",
    difficulty: "Beginner",
    topic: "ORDER BY",
    starter_sql: "SELECT *\nFROM Loans\nORDER BY ...;",
    reference_sql: "SELECT * FROM Loans ORDER BY LoanAmount DESC;",
    comparison_mode: "ordered",
  },
  {
    id: 4,
    title: "COUNT",
    description: "The operations team needs a single count of total loan applications received by SQLBank.",
    difficulty: "Beginner",
    topic: "COUNT",
    starter_sql: "SELECT COUNT(*) AS ApplicationCount\nFROM Applications;",
    reference_sql: "SELECT COUNT(*) AS ApplicationCount FROM Applications;",
    comparison_mode: "single_value",
  },
  {
    id: 5,
    title: "GROUP BY",
    description: "Summarize application volume by status so SQLBank can compare Approved, Declined, and Pending application counts.",
    difficulty: "Beginner",
    topic: "GROUP BY",
    starter_sql: "SELECT Status, COUNT(*) AS ApplicationCount\nFROM Applications\nGROUP BY Status;",
    reference_sql: "SELECT Status, COUNT(*) AS ApplicationCount FROM Applications GROUP BY Status;",
    comparison_mode: "unordered",
  },
  {
    id: 6,
    title: "SUM + JOIN",
    description: "SQLBank leadership wants provincial lending totals. Calculate the total loan amount issued in each province.",
    difficulty: "Intermediate",
    topic: "Aggregation",
    starter_sql: "SELECT b.Province, SUM(l.LoanAmount) AS TotalLoanAmount\nFROM Loans l\nJOIN Branches b ON ...\nGROUP BY b.Province;",
    reference_sql: "SELECT b.Province, SUM(l.LoanAmount) AS TotalLoanAmount FROM Loans l INNER JOIN Branches b ON l.BranchID = b.BranchID GROUP BY b.Province;",
    comparison_mode: "unordered",
  },
  {
    id: 7,
    title: "INNER JOIN",
    description: "The loan servicing team needs customer names beside each loan. Display every loan with the customer's first and last name.",
    difficulty: "Intermediate",
    topic: "JOIN",
    starter_sql: "SELECT l.LoanID, c.FirstName, c.LastName, l.LoanAmount\nFROM Loans l\nJOIN Customers c ON ...;",
    reference_sql: "SELECT l.LoanID, c.FirstName, c.LastName, l.LoanAmount FROM Loans l INNER JOIN Customers c ON l.CustomerID = c.CustomerID;",
    comparison_mode: "unordered",
  },
  {
    id: 8,
    title: "Multiple Tables",
    description: "Calculate the total value of loans issued by each SQLBank branch. Include branch name and total loan amount.",
    difficulty: "Intermediate",
    topic: "Multi-table JOIN",
    starter_sql: "SELECT b.BranchName, SUM(l.LoanAmount) AS TotalLoanAmount\nFROM Branches b\nJOIN Loans l ON ...\nGROUP BY b.BranchName;",
    reference_sql: "SELECT b.BranchName, SUM(l.LoanAmount) AS TotalLoanAmount FROM Branches b INNER JOIN Loans l ON b.BranchID = l.BranchID GROUP BY b.BranchName;",
    comparison_mode: "unordered",
  },
  {
    id: 9,
    title: "CASE",
    description: "Create a simple portfolio size label for every loan. Small: less than 5000. Medium: 5000 to less than 15000. Large: 15000 or more.",
    difficulty: "Intermediate",
    topic: "CASE",
    starter_sql: "SELECT LoanID, LoanAmount,\n  CASE\n    WHEN ... THEN 'Small'\n  END AS LoanSize\nFROM Loans;",
    reference_sql: "SELECT LoanID, LoanAmount, CASE WHEN LoanAmount < 5000 THEN 'Small' WHEN LoanAmount < 15000 THEN 'Medium' ELSE 'Large' END AS LoanSize FROM Loans;",
    comparison_mode: "unordered",
  },
  {
    id: 10,
    title: "Branch Performance",
    description: "SQLBank management wants to understand branch performance. Calculate the loan application approval rate for each branch and return the five branches with the highest approval rate.",
    difficulty: "Intermediate",
    topic: "Business Analysis",
    starter_sql: "SELECT TOP 5\nFROM Branches b\nJOIN Applications a ON ...",
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
