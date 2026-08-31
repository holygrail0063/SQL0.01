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
  validation?: ExerciseValidation;
};

type Row = Record<string, string | number | null>;

export type ResultColumn = {
  name: string;
  normalizedName: string;
  dataType?: string;
};

export type NormalizedQueryResult = {
  columns: string[];
  columnDetails: ResultColumn[];
  rows: unknown[][];
  rowCount: number;
};

export type EvaluationType =
  | "correct"
  | "missing_columns"
  | "extra_columns"
  | "wrong_rows"
  | "empty_result"
  | "wrong_order"
  | "wrong_row_count"
  | "wrong_alias"
  | "aggregation_mismatch"
  | "logic_error";

export type ExerciseValidation = {
  columnPolicy: "exact" | "required_allow_extra" | "all_source_columns" | "single_value" | "custom";
  rowPolicy: "exact_multiset" | "exact_set" | "subset" | "single_value" | "custom";
  orderPolicy: "ignore" | "required";
  aliasPolicy: "ignore" | "required";
  numericTolerance?: number;
  expectedNonEmpty?: boolean;
  requiredConcepts?: string[];
  strictColumns?: boolean;
  requireColumnOrder?: boolean;
};

export type ExerciseEvaluation = {
  correct: boolean;
  type: EvaluationType;
  message: string | null;
  details?: Record<string, unknown>;
};

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
      { name: "CustomerStatus", type: "nvarchar(20)" },
      { name: "CustomerSegment", type: "nvarchar(40)" },
      { name: "AcquisitionChannel", type: "nvarchar(40)" },
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
      { name: "ProductID", type: "int" },
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
  {
    table: "Products",
    columns: [
      { name: "ProductID", type: "int" },
      { name: "ProductName", type: "nvarchar(80)" },
      { name: "ProductCategory", type: "nvarchar(50)" },
      { name: "InterestRate", type: "decimal(5,2)" },
      { name: "LaunchDate", type: "date" },
      { name: "ProductStatus", type: "nvarchar(20)" },
    ],
  },
  {
    table: "Accounts",
    columns: [
      { name: "AccountID", type: "int" },
      { name: "CustomerID", type: "int" },
      { name: "ProductID", type: "int" },
      { name: "AccountType", type: "nvarchar(40)" },
      { name: "OpenedDate", type: "date" },
      { name: "ClosedDate", type: "date" },
      { name: "Balance", type: "decimal(12,2)" },
      { name: "AccountStatus", type: "nvarchar(20)" },
    ],
  },
  {
    table: "Transactions",
    columns: [
      { name: "TransactionID", type: "int" },
      { name: "AccountID", type: "int" },
      { name: "TransactionDate", type: "date" },
      { name: "TransactionType", type: "nvarchar(30)" },
      { name: "Amount", type: "decimal(12,2)" },
      { name: "MerchantCategory", type: "nvarchar(60)" },
      { name: "Channel", type: "nvarchar(30)" },
      { name: "TransactionStatus", type: "nvarchar(20)" },
    ],
  },
  {
    table: "Campaigns",
    columns: [
      { name: "CampaignID", type: "int" },
      { name: "CampaignName", type: "nvarchar(100)" },
      { name: "CampaignType", type: "nvarchar(40)" },
      { name: "StartDate", type: "date" },
      { name: "EndDate", type: "date" },
      { name: "Channel", type: "nvarchar(30)" },
      { name: "CampaignCost", type: "decimal(12,2)" },
    ],
  },
  {
    table: "CustomerEvents",
    columns: [
      { name: "EventID", type: "int" },
      { name: "CustomerID", type: "int" },
      { name: "SessionID", type: "nvarchar(40)" },
      { name: "EventName", type: "nvarchar(60)" },
      { name: "EventTimestamp", type: "date" },
      { name: "ProductID", type: "int" },
      { name: "Channel", type: "nvarchar(30)" },
      { name: "DeviceType", type: "nvarchar(30)" },
    ],
  },
  {
    table: "MonthlyTargets",
    columns: [
      { name: "Month", type: "nvarchar(7)" },
      { name: "BranchID", type: "int" },
      { name: "ApplicationsTarget", type: "int" },
      { name: "ApprovalsTarget", type: "int" },
      { name: "RevenueTarget", type: "decimal(12,2)" },
      { name: "CustomerGrowthTarget", type: "int" },
    ],
  },
];

const challenges: Challenge[] = [
  {
    "id": 1,
    "title": "Open the customer file",
    "description": "Return every column and every row from Customers.",
    "difficulty": "Beginner",
    "topic": "SELECT",
    "starter_sql": "",
    "concept": "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName;",
    "success_criteria": [
      "Return every column and every row from Customers."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use SELECT for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how SELECT, FROM answers the business request before you run the query."
    },
    "reference_sql": "SELECT *\nFROM Customers;",
    "comparison_mode": "unordered"
  },
  {
    "id": 2,
    "title": "Choose customer fields",
    "description": "Return CustomerID, FirstName, LastName, Province, and City from Customers.",
    "difficulty": "Beginner",
    "topic": "Column selection",
    "starter_sql": "",
    "concept": "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName;",
    "success_criteria": [
      "Return CustomerID, FirstName, LastName, Province, and City from Customers."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use Column selection for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how Column selection answers the business request before you run the query."
    },
    "reference_sql": "SELECT CustomerID, FirstName, LastName, Province, City\nFROM Customers;",
    "comparison_mode": "unordered"
  },
  {
    "id": 3,
    "title": "Find Ontario customers",
    "description": "Return every column for customers whose Province is Ontario.",
    "difficulty": "Beginner",
    "topic": "WHERE",
    "starter_sql": "",
    "concept": "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return every column for customers whose Province is Ontario.",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use WHERE for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how WHERE answers the business request before you run the query."
    },
    "reference_sql": "SELECT *\nFROM Customers\nWHERE Province = 'Ontario';",
    "comparison_mode": "unordered"
  },
  {
    "id": 4,
    "title": "Active Ontario customers",
    "description": "Customer Operations needs active Ontario customers for a regional outreach list.\r\nReturn CustomerID, FirstName, LastName, City, CustomerSegment, and AcquisitionChannel.\r\nOnly include customers whose Province is Ontario and CustomerStatus is Active.\r\nOrder the results by CustomerID.",
    "difficulty": "Beginner",
    "topic": "WHERE",
    "starter_sql": "",
    "concept": "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return CustomerID, FirstName, LastName, City, CustomerSegment, and AcquisitionChannel.",
      "Apply every requested filter.",
      "Return rows in the requested order."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use WHERE for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how WHERE, AND, ORDER BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT CustomerID,\n       FirstName,\n       LastName,\n       City,\n       CustomerSegment,\n       AcquisitionChannel\nFROM Customers\nWHERE Province = 'Ontario'\n  AND CustomerStatus = 'Active'\nORDER BY CustomerID;",
    "comparison_mode": "ordered"
  },
  {
    "id": 5,
    "title": "Inspect the branch network",
    "description": "Return BranchID, BranchName, Province, and City for every branch.",
    "difficulty": "Beginner",
    "topic": "SELECT columns",
    "starter_sql": "",
    "concept": "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName;",
    "success_criteria": [
      "Return BranchID, BranchName, Province, and City for every branch."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use SELECT columns for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how SELECT columns answers the business request before you run the query."
    },
    "reference_sql": "SELECT BranchID, BranchName, Province, City\nFROM Branches;",
    "comparison_mode": "unordered"
  },
  {
    "id": 6,
    "title": "Inspect account balances",
    "description": "Return AccountID, CustomerID, AccountType, Balance, and AccountStatus from Accounts.",
    "difficulty": "Beginner",
    "topic": "SELECT columns",
    "starter_sql": "",
    "concept": "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName;",
    "success_criteria": [
      "Return AccountID, CustomerID, AccountType, Balance, and AccountStatus from Accounts."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use SELECT columns for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how SELECT columns answers the business request before you run the query."
    },
    "reference_sql": "SELECT AccountID, CustomerID, AccountType, Balance, AccountStatus\nFROM Accounts;",
    "comparison_mode": "unordered"
  },
  {
    "id": 7,
    "title": "Toronto customers",
    "description": "Return CustomerID, FirstName, LastName, and CustomerStatus for customers in Toronto.",
    "difficulty": "Beginner",
    "topic": "WHERE",
    "starter_sql": "",
    "concept": "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return CustomerID, FirstName, LastName, and CustomerStatus for customers in Toronto."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use WHERE for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how WHERE answers the business request before you run the query."
    },
    "reference_sql": "SELECT CustomerID, FirstName, LastName, CustomerStatus\nFROM Customers\nWHERE City = 'Toronto';",
    "comparison_mode": "unordered"
  },
  {
    "id": 8,
    "title": "Active loans",
    "description": "Return LoanID, CustomerID, LoanAmount, and InterestRate for loans whose LoanStatus is Active.",
    "difficulty": "Beginner",
    "topic": "WHERE",
    "starter_sql": "",
    "concept": "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return LoanID, CustomerID, LoanAmount, and InterestRate for loans whose LoanStatus is Active.",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use WHERE for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how WHERE answers the business request before you run the query."
    },
    "reference_sql": "SELECT LoanID, CustomerID, LoanAmount, InterestRate\nFROM Loans\nWHERE LoanStatus = 'Active';",
    "comparison_mode": "unordered"
  },
  {
    "id": 9,
    "title": "Large application requests",
    "description": "Return applications where RequestedAmount is at least 25000.",
    "difficulty": "Beginner",
    "topic": "Numeric comparison",
    "starter_sql": "",
    "concept": "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return applications where RequestedAmount is at least 25000.",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use Numeric comparison for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how Numeric comparison answers the business request before you run the query."
    },
    "reference_sql": "SELECT *\nFROM Applications\nWHERE RequestedAmount >= 25000;",
    "comparison_mode": "unordered"
  },
  {
    "id": 10,
    "title": "Higher risk-score applications",
    "description": "Return ApplicationID, RequestedAmount, Status, and RiskScore for applications whose RiskScore is at least 700.",
    "difficulty": "Beginner",
    "topic": "Numeric comparison",
    "starter_sql": "",
    "concept": "This question builds the first SQL habits: choose the correct table, return the requested columns, and add simple filters only when the business request asks for them.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return ApplicationID, RequestedAmount, Status, and RiskScore for applications whose RiskScore is at least 700.",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use Numeric comparison for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how Numeric comparison answers the business request before you run the query."
    },
    "reference_sql": "SELECT ApplicationID, RequestedAmount, Status, RiskScore\nFROM Applications\nWHERE RiskScore >= 700;",
    "comparison_mode": "unordered"
  },
  {
    "id": 11,
    "title": "Mobile transactions",
    "description": "Return TransactionID, AccountID, TransactionType, Amount, and MerchantCategory for transactions where Channel is Mobile.",
    "difficulty": "Beginner",
    "topic": "WHERE",
    "starter_sql": "",
    "concept": "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return TransactionID, AccountID, TransactionType, Amount, and MerchantCategory for transactions where Channel is Mobile.",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use WHERE for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how WHERE answers the business request before you run the query."
    },
    "reference_sql": "SELECT TransactionID,\n       AccountID,\n       TransactionType,\n       Amount,\n       MerchantCategory\nFROM Transactions\nWHERE Channel = 'Mobile';",
    "comparison_mode": "unordered"
  },
  {
    "id": 12,
    "title": "Active Toronto customers",
    "description": "Return CustomerID, FirstName, LastName, and CustomerSegment for active customers who live in Toronto.",
    "difficulty": "Beginner",
    "topic": "AND",
    "starter_sql": "",
    "concept": "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return CustomerID, FirstName, LastName, and CustomerSegment for active customers who live in Toronto."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use AND for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how AND answers the business request before you run the query."
    },
    "reference_sql": "SELECT CustomerID, FirstName, LastName, CustomerSegment\nFROM Customers\nWHERE City = 'Toronto'\n  AND CustomerStatus = 'Active';",
    "comparison_mode": "unordered"
  },
  {
    "id": 13,
    "title": "Alberta or British Columbia",
    "description": "Return CustomerID, FirstName, LastName, Province, and City for customers whose Province is Alberta or British Columbia.",
    "difficulty": "Beginner",
    "topic": "OR",
    "starter_sql": "",
    "concept": "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return CustomerID, FirstName, LastName, Province, and City for customers whose Province is Alberta or British Columbia.",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use OR for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how OR answers the business request before you run the query."
    },
    "reference_sql": "SELECT CustomerID, FirstName, LastName, Province, City\nFROM Customers\nWHERE Province = 'Alberta'\n   OR Province = 'British Columbia';",
    "comparison_mode": "unordered"
  },
  {
    "id": 14,
    "title": "Three-province customer list",
    "description": "Return CustomerID, FirstName, LastName, and Province for customers in Ontario, Alberta, or Manitoba.",
    "difficulty": "Beginner",
    "topic": "IN",
    "starter_sql": "",
    "concept": "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return CustomerID, FirstName, LastName, and Province for customers in Ontario, Alberta, or Manitoba."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use IN for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how IN answers the business request before you run the query."
    },
    "reference_sql": "SELECT CustomerID, FirstName, LastName, Province\nFROM Customers\nWHERE Province IN ('Ontario', 'Alberta', 'Manitoba');",
    "comparison_mode": "unordered"
  },
  {
    "id": 15,
    "title": "Mid-size applications",
    "description": "Return ApplicationID, CustomerID, RequestedAmount, and Status for applications with RequestedAmount between 10000 and 20000 inclusive.",
    "difficulty": "Beginner",
    "topic": "BETWEEN",
    "starter_sql": "",
    "concept": "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return ApplicationID, CustomerID, RequestedAmount, and Status for applications with RequestedAmount between 10000 and 20000 inclusive.",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use BETWEEN for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how BETWEEN answers the business request before you run the query."
    },
    "reference_sql": "SELECT ApplicationID, CustomerID, RequestedAmount, Status\nFROM Applications\nWHERE RequestedAmount BETWEEN 10000 AND 20000;",
    "comparison_mode": "unordered"
  },
  {
    "id": 16,
    "title": "Advisory Centre branches",
    "description": "Return BranchID, BranchName, Province, and City for branches whose BranchName contains the text \"Advisory Centre\".",
    "difficulty": "Beginner",
    "topic": "LIKE",
    "starter_sql": "",
    "concept": "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return BranchID, BranchName, Province, and City for branches whose BranchName contains the text \"Advisory Centre\".",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use LIKE for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how LIKE answers the business request before you run the query."
    },
    "reference_sql": "SELECT BranchID, BranchName, Province, City\nFROM Branches\nWHERE BranchName LIKE '%Advisory Centre%';",
    "comparison_mode": "unordered"
  },
  {
    "id": 17,
    "title": "Names beginning with A",
    "description": "Return CustomerID, FirstName, LastName, and Province for customers whose FirstName starts with A.",
    "difficulty": "Beginner",
    "topic": "LIKE",
    "starter_sql": "",
    "concept": "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return CustomerID, FirstName, LastName, and Province for customers whose FirstName starts with A.",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use LIKE for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how LIKE answers the business request before you run the query."
    },
    "reference_sql": "SELECT CustomerID, FirstName, LastName, Province\nFROM Customers\nWHERE FirstName LIKE 'A%';",
    "comparison_mode": "unordered"
  },
  {
    "id": 18,
    "title": "Accounts without a closure date",
    "description": "Return AccountID, CustomerID, AccountType, OpenedDate, Balance, and AccountStatus for accounts where ClosedDate is NULL.",
    "difficulty": "Beginner",
    "topic": "IS NULL",
    "starter_sql": "",
    "concept": "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return AccountID, CustomerID, AccountType, OpenedDate, Balance, and AccountStatus for accounts where ClosedDate is NULL.",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use IS NULL for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how IS NULL answers the business request before you run the query."
    },
    "reference_sql": "SELECT AccountID,\n       CustomerID,\n       AccountType,\n       OpenedDate,\n       Balance,\n       AccountStatus\nFROM Accounts\nWHERE ClosedDate IS NULL;",
    "comparison_mode": "unordered"
  },
  {
    "id": 19,
    "title": "Customers who are not closed",
    "description": "Return CustomerID, FirstName, LastName, and CustomerStatus for customers whose CustomerStatus is not Closed.",
    "difficulty": "Beginner",
    "topic": "Inequality",
    "starter_sql": "",
    "concept": "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return CustomerID, FirstName, LastName, and CustomerStatus for customers whose CustomerStatus is not Closed.",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use Inequality for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how Inequality answers the business request before you run the query."
    },
    "reference_sql": "SELECT CustomerID, FirstName, LastName, CustomerStatus\nFROM Customers\nWHERE CustomerStatus <> 'Closed';",
    "comparison_mode": "unordered"
  },
  {
    "id": 20,
    "title": "Largest loans first",
    "description": "Return all loans sorted from highest LoanAmount to lowest.",
    "difficulty": "Beginner",
    "topic": "ORDER BY DESC",
    "starter_sql": "",
    "concept": "Filtering turns broad SQLBank tables into focused business lists. Each condition should match a phrase in the request.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName;",
    "success_criteria": [
      "Return all loans sorted from highest LoanAmount to lowest.",
      "Return rows in the requested order."
    ],
    "guidance": {
      "Completely New": "Start from the table named in the request, then add the requested columns.",
      "Know the Basics": "Use ORDER BY DESC for this question.",
      "Comfortable With SQL": "Match the requested filters, output columns, and ordering exactly.",
      "Interview Preparation": "Explain how ORDER BY DESC answers the business request before you run the query."
    },
    "reference_sql": "SELECT *\nFROM Loans\nORDER BY LoanAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 21,
    "title": "Top 10 loans",
    "description": "Return LoanID, CustomerID, LoanAmount, and InterestRate for the 10 largest loans.",
    "difficulty": "Beginner",
    "topic": "TOP",
    "starter_sql": "",
    "concept": "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName;",
    "success_criteria": [
      "Return LoanID, CustomerID, LoanAmount, and InterestRate for the 10 largest loans.",
      "Return rows in the requested order."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested TOP pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how TOP, ORDER BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT TOP 10 LoanID, CustomerID, LoanAmount, InterestRate\nFROM Loans\nORDER BY LoanAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 22,
    "title": "Top five account balances",
    "description": "Return AccountID, CustomerID, AccountType, and Balance for the five highest account balances.",
    "difficulty": "Beginner",
    "topic": "TOP",
    "starter_sql": "",
    "concept": "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName;",
    "success_criteria": [
      "Return AccountID, CustomerID, AccountType, and Balance for the five highest account balances.",
      "Return rows in the requested order."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested TOP pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how TOP, ORDER BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT TOP 5 AccountID, CustomerID, AccountType, Balance\nFROM Accounts\nORDER BY Balance DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 23,
    "title": "Lowest risk scores first",
    "description": "Return ApplicationID, CustomerID, RequestedAmount, and RiskScore ordered from lowest RiskScore to highest.",
    "difficulty": "Beginner",
    "topic": "ORDER BY ASC",
    "starter_sql": "",
    "concept": "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName;",
    "success_criteria": [
      "Return ApplicationID, CustomerID, RequestedAmount, and RiskScore ordered from lowest RiskScore to highest.",
      "Return rows in the requested order."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested ORDER BY ASC pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how ORDER BY ASC answers the business request before you run the query."
    },
    "reference_sql": "SELECT ApplicationID, CustomerID, RequestedAmount, RiskScore\nFROM Applications\nORDER BY RiskScore ASC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 24,
    "title": "Unique provinces",
    "description": "Return a list of unique provinces found in the Customers table.\r\nSort the provinces alphabetically.",
    "difficulty": "Beginner",
    "topic": "DISTINCT",
    "starter_sql": "",
    "concept": "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName;",
    "success_criteria": [
      "Return a list of unique provinces found in the Customers table.",
      "Return rows in the requested order."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested DISTINCT pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how DISTINCT, ORDER BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT DISTINCT Province\nFROM Customers\nORDER BY Province;",
    "comparison_mode": "ordered"
  },
  {
    "id": 25,
    "title": "Unique merchant categories",
    "description": "Return each unique MerchantCategory from Transactions in alphabetical order.",
    "difficulty": "Beginner",
    "topic": "DISTINCT",
    "starter_sql": "",
    "concept": "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName;",
    "success_criteria": [
      "Return each unique MerchantCategory from Transactions in alphabetical order.",
      "Return rows in the requested order."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested DISTINCT pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how DISTINCT, ORDER BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT DISTINCT MerchantCategory\nFROM Transactions\nORDER BY MerchantCategory;",
    "comparison_mode": "ordered"
  },
  {
    "id": 26,
    "title": "Create readable aliases",
    "description": "Return:\r\n- CustomerID as CustomerNumber\r\n- FirstName as GivenName\r\n- LastName as FamilyName\r\n- Province",
    "difficulty": "Beginner",
    "topic": "Aliases",
    "starter_sql": "",
    "concept": "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName;",
    "success_criteria": [
      "Return:"
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested Aliases pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how Aliases answers the business request before you run the query."
    },
    "reference_sql": "SELECT CustomerID AS CustomerNumber,\n       FirstName AS GivenName,\n       LastName AS FamilyName,\n       Province\nFROM Customers;",
    "comparison_mode": "unordered"
  },
  {
    "id": 27,
    "title": "Most recent applications",
    "description": "Return the 10 most recent applications with ApplicationID, CustomerID, ApplicationDate, RequestedAmount, and Status.",
    "difficulty": "Beginner",
    "topic": "TOP",
    "starter_sql": "",
    "concept": "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName;",
    "success_criteria": [
      "Return the 10 most recent applications with ApplicationID, CustomerID, ApplicationDate, RequestedAmount, and Status.",
      "Return rows in the requested order."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested TOP pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how TOP, multi-column ORDER BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT TOP 10\n       ApplicationID,\n       CustomerID,\n       ApplicationDate,\n       RequestedAmount,\n       Status\nFROM Applications\nORDER BY ApplicationDate DESC, ApplicationID DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 28,
    "title": "Count SQLBank customers",
    "description": "Return one value named CustomerCount containing the total number of rows in Customers.",
    "difficulty": "Beginner",
    "topic": "COUNT",
    "starter_sql": "",
    "concept": "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT COUNT(*) AS RowCount\nFROM TableName;",
    "success_criteria": [
      "Return one value named CustomerCount containing the total number of rows in Customers.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested COUNT pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how COUNT answers the business request before you run the query."
    },
    "reference_sql": "SELECT COUNT(*) AS CustomerCount\nFROM Customers;",
    "comparison_mode": "unordered"
  },
  {
    "id": 29,
    "title": "Count active customers",
    "description": "Return one value named ActiveCustomerCount containing the number of customers whose CustomerStatus is Active.",
    "difficulty": "Beginner",
    "topic": "COUNT",
    "starter_sql": "",
    "concept": "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT COUNT(*) AS RowCount\nFROM TableName;",
    "success_criteria": [
      "Return one value named ActiveCustomerCount containing the number of customers whose CustomerStatus is Active.",
      "Apply every requested filter.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested COUNT pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how COUNT, WHERE answers the business request before you run the query."
    },
    "reference_sql": "SELECT COUNT(*) AS ActiveCustomerCount\nFROM Customers\nWHERE CustomerStatus = 'Active';",
    "comparison_mode": "unordered"
  },
  {
    "id": 30,
    "title": "Total loan portfolio",
    "description": "Return the total LoanAmount across all loans as TotalLoanAmount.",
    "difficulty": "Beginner",
    "topic": "SUM",
    "starter_sql": "",
    "concept": "Sorting, aliases, distinct values, TOP, and basic aggregates make SQL results easier to review and report.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT COUNT(*) AS RowCount\nFROM TableName;",
    "success_criteria": [
      "Return the total LoanAmount across all loans as TotalLoanAmount.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested SUM pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how SUM answers the business request before you run the query."
    },
    "reference_sql": "SELECT SUM(LoanAmount) AS TotalLoanAmount\nFROM Loans;",
    "comparison_mode": "unordered"
  },
  {
    "id": 31,
    "title": "Average loan interest rate",
    "description": "Return the average InterestRate across all loans as AverageInterestRate.",
    "difficulty": "Beginner",
    "topic": "AVG",
    "starter_sql": "",
    "concept": "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT COUNT(*) AS RowCount\nFROM TableName;",
    "success_criteria": [
      "Return the average InterestRate across all loans as AverageInterestRate.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested AVG pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how AVG answers the business request before you run the query."
    },
    "reference_sql": "SELECT AVG(InterestRate) AS AverageInterestRate\nFROM Loans;",
    "comparison_mode": "unordered"
  },
  {
    "id": 32,
    "title": "Smallest and largest requested amount",
    "description": "Return:\r\n- minimum RequestedAmount as MinimumRequestedAmount\r\n- maximum RequestedAmount as MaximumRequestedAmount",
    "difficulty": "Beginner",
    "topic": "MIN",
    "starter_sql": "",
    "concept": "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT COUNT(*) AS RowCount\nFROM TableName;",
    "success_criteria": [
      "Return:",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested MIN pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how MIN, MAX answers the business request before you run the query."
    },
    "reference_sql": "SELECT MIN(RequestedAmount) AS MinimumRequestedAmount,\n       MAX(RequestedAmount) AS MaximumRequestedAmount\nFROM Applications;",
    "comparison_mode": "unordered"
  },
  {
    "id": 33,
    "title": "Total completed payment amount",
    "description": "Return the sum of Amount for payments whose PaymentStatus is Completed.\r\nName the result CompletedPaymentAmount.",
    "difficulty": "Beginner",
    "topic": "SUM",
    "starter_sql": "",
    "concept": "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT COUNT(*) AS RowCount\nFROM TableName;",
    "success_criteria": [
      "Return the sum of Amount for payments whose PaymentStatus is Completed.",
      "Apply every requested filter.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested SUM pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how SUM, WHERE answers the business request before you run the query."
    },
    "reference_sql": "SELECT SUM(Amount) AS CompletedPaymentAmount\nFROM Payments\nWHERE PaymentStatus = 'Completed';",
    "comparison_mode": "unordered"
  },
  {
    "id": 34,
    "title": "Count failed transactions",
    "description": "Return the number of failed transactions as FailedTransactionCount.",
    "difficulty": "Beginner",
    "topic": "COUNT",
    "starter_sql": "",
    "concept": "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT COUNT(*) AS RowCount\nFROM TableName;",
    "success_criteria": [
      "Return the number of failed transactions as FailedTransactionCount.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested COUNT pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how COUNT, WHERE answers the business request before you run the query."
    },
    "reference_sql": "SELECT COUNT(*) AS FailedTransactionCount\nFROM Transactions\nWHERE TransactionStatus = 'Failed';",
    "comparison_mode": "unordered"
  },
  {
    "id": 35,
    "title": "Total campaign spend",
    "description": "Return the sum of CampaignCost across Campaigns as TotalCampaignCost.",
    "difficulty": "Beginner",
    "topic": "SUM",
    "starter_sql": "",
    "concept": "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT COUNT(*) AS RowCount\nFROM TableName;",
    "success_criteria": [
      "Return the sum of CampaignCost across Campaigns as TotalCampaignCost.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested SUM pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how SUM answers the business request before you run the query."
    },
    "reference_sql": "SELECT SUM(CampaignCost) AS TotalCampaignCost\nFROM Campaigns;",
    "comparison_mode": "unordered"
  },
  {
    "id": 36,
    "title": "Customers by province",
    "description": "Return Province and CustomerCount for each province.\r\nOrder from the highest CustomerCount to lowest.",
    "difficulty": "Beginner",
    "topic": "GROUP BY",
    "starter_sql": "",
    "concept": "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT CategoryColumn, COUNT(*) AS ItemCount\nFROM TableName\nGROUP BY CategoryColumn;",
    "success_criteria": [
      "Return Province and CustomerCount for each province.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested GROUP BY pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how GROUP BY, COUNT answers the business request before you run the query."
    },
    "reference_sql": "SELECT Province,\n       COUNT(*) AS CustomerCount\nFROM Customers\nGROUP BY Province\nORDER BY CustomerCount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 37,
    "title": "Applications by status",
    "description": "Return Status and ApplicationCount for each application status.",
    "difficulty": "Beginner",
    "topic": "GROUP BY",
    "starter_sql": "",
    "concept": "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT CategoryColumn, COUNT(*) AS ItemCount\nFROM TableName\nGROUP BY CategoryColumn;",
    "success_criteria": [
      "Return Status and ApplicationCount for each application status.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested GROUP BY pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how GROUP BY, COUNT answers the business request before you run the query."
    },
    "reference_sql": "SELECT Status,\n       COUNT(*) AS ApplicationCount\nFROM Applications\nGROUP BY Status\nORDER BY ApplicationCount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 38,
    "title": "Accounts by type",
    "description": "Return AccountType and AccountCount for each account type.",
    "difficulty": "Beginner",
    "topic": "GROUP BY",
    "starter_sql": "",
    "concept": "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT CategoryColumn, COUNT(*) AS ItemCount\nFROM TableName\nGROUP BY CategoryColumn;",
    "success_criteria": [
      "Return AccountType and AccountCount for each account type.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested GROUP BY pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how GROUP BY, COUNT answers the business request before you run the query."
    },
    "reference_sql": "SELECT AccountType,\n       COUNT(*) AS AccountCount\nFROM Accounts\nGROUP BY AccountType\nORDER BY AccountCount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 39,
    "title": "Transactions by channel",
    "description": "Return Channel and TransactionCount for each transaction channel.",
    "difficulty": "Beginner",
    "topic": "GROUP BY",
    "starter_sql": "",
    "concept": "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT CategoryColumn, COUNT(*) AS ItemCount\nFROM TableName\nGROUP BY CategoryColumn;",
    "success_criteria": [
      "Return Channel and TransactionCount for each transaction channel.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested GROUP BY pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how GROUP BY, COUNT answers the business request before you run the query."
    },
    "reference_sql": "SELECT Channel,\n       COUNT(*) AS TransactionCount\nFROM Transactions\nGROUP BY Channel\nORDER BY TransactionCount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 40,
    "title": "Transaction value by type",
    "description": "Return TransactionType, TransactionCount, and TotalAmount for each transaction type.",
    "difficulty": "Beginner",
    "topic": "GROUP BY",
    "starter_sql": "",
    "concept": "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT CategoryColumn, COUNT(*) AS ItemCount\nFROM TableName\nGROUP BY CategoryColumn;",
    "success_criteria": [
      "Return TransactionType, TransactionCount, and TotalAmount for each transaction type.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested GROUP BY pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how GROUP BY, COUNT, SUM answers the business request before you run the query."
    },
    "reference_sql": "SELECT TransactionType,\n       COUNT(*) AS TransactionCount,\n       SUM(Amount) AS TotalAmount\nFROM Transactions\nGROUP BY TransactionType\nORDER BY TotalAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 41,
    "title": "Average requested amount by status",
    "description": "Return Status and AverageRequestedAmount for each application status.",
    "difficulty": "Beginner",
    "topic": "GROUP BY",
    "starter_sql": "",
    "concept": "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT CategoryColumn, COUNT(*) AS ItemCount\nFROM TableName\nGROUP BY CategoryColumn;",
    "success_criteria": [
      "Return Status and AverageRequestedAmount for each application status.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested GROUP BY pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how GROUP BY, AVG answers the business request before you run the query."
    },
    "reference_sql": "SELECT Status,\n       AVG(RequestedAmount) AS AverageRequestedAmount\nFROM Applications\nGROUP BY Status\nORDER BY AverageRequestedAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 42,
    "title": "Provinces with more than 50 customers",
    "description": "Return Province and CustomerCount only for provinces containing more than 50 customers.",
    "difficulty": "Beginner",
    "topic": "GROUP BY",
    "starter_sql": "",
    "concept": "Aggregate queries summarize many rows into business metrics. GROUP BY controls the category each metric is calculated for.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT CategoryColumn, COUNT(*) AS ItemCount\nFROM TableName\nGROUP BY CategoryColumn;",
    "success_criteria": [
      "Return Province and CustomerCount only for provinces containing more than 50 customers.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested GROUP BY pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how GROUP BY, HAVING answers the business request before you run the query."
    },
    "reference_sql": "SELECT Province,\n       COUNT(*) AS CustomerCount\nFROM Customers\nGROUP BY Province\nHAVING COUNT(*) > 50\nORDER BY CustomerCount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 43,
    "title": "Customer names on loans",
    "description": "Return LoanID, FirstName, LastName, LoanAmount, and LoanStatus for every loan.",
    "difficulty": "Beginner",
    "topic": "INNER JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return LoanID, FirstName, LastName, LoanAmount, and LoanStatus for every loan."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested INNER JOIN pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how INNER JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT l.LoanID,\n       c.FirstName,\n       c.LastName,\n       l.LoanAmount,\n       l.LoanStatus\nFROM Loans AS l\nINNER JOIN Customers AS c\n    ON l.CustomerID = c.CustomerID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 44,
    "title": "Branch names on applications",
    "description": "Return ApplicationID, BranchName, ApplicationDate, RequestedAmount, and Status.",
    "difficulty": "Beginner",
    "topic": "INNER JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return ApplicationID, BranchName, ApplicationDate, RequestedAmount, and Status."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested INNER JOIN pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how INNER JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT a.ApplicationID,\n       b.BranchName,\n       a.ApplicationDate,\n       a.RequestedAmount,\n       a.Status\nFROM Applications AS a\nINNER JOIN Branches AS b\n    ON a.BranchID = b.BranchID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 45,
    "title": "Loan information on payments",
    "description": "Return PaymentID, LoanID, LoanAmount, PaymentDate, Amount, and PaymentStatus.",
    "difficulty": "Beginner",
    "topic": "INNER JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return PaymentID, LoanID, LoanAmount, PaymentDate, Amount, and PaymentStatus."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested INNER JOIN pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how INNER JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT p.PaymentID,\n       l.LoanID,\n       l.LoanAmount,\n       p.PaymentDate,\n       p.Amount,\n       p.PaymentStatus\nFROM Payments AS p\nINNER JOIN Loans AS l\n    ON p.LoanID = l.LoanID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 46,
    "title": "Customer names on accounts",
    "description": "Return AccountID, FirstName, LastName, AccountType, Balance, and AccountStatus.",
    "difficulty": "Beginner",
    "topic": "INNER JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return AccountID, FirstName, LastName, AccountType, Balance, and AccountStatus."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested INNER JOIN pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how INNER JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT a.AccountID,\n       c.FirstName,\n       c.LastName,\n       a.AccountType,\n       a.Balance,\n       a.AccountStatus\nFROM Accounts AS a\nINNER JOIN Customers AS c\n    ON a.CustomerID = c.CustomerID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 47,
    "title": "Product names on accounts",
    "description": "Return AccountID, ProductName, ProductCategory, AccountType, Balance, and AccountStatus.",
    "difficulty": "Beginner",
    "topic": "INNER JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return AccountID, ProductName, ProductCategory, AccountType, Balance, and AccountStatus."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested INNER JOIN pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how INNER JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT a.AccountID,\n       p.ProductName,\n       p.ProductCategory,\n       a.AccountType,\n       a.Balance,\n       a.AccountStatus\nFROM Accounts AS a\nINNER JOIN Products AS p\n    ON a.ProductID = p.ProductID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 48,
    "title": "Product names on applications",
    "description": "Return ApplicationID, ProductName, ProductCategory, RequestedAmount, and Status.",
    "difficulty": "Beginner",
    "topic": "INNER JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return ApplicationID, ProductName, ProductCategory, RequestedAmount, and Status."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested INNER JOIN pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how INNER JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT a.ApplicationID,\n       p.ProductName,\n       p.ProductCategory,\n       a.RequestedAmount,\n       a.Status\nFROM Applications AS a\nINNER JOIN Products AS p\n    ON a.ProductID = p.ProductID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 49,
    "title": "Account type on transactions",
    "description": "Return TransactionID, AccountType, TransactionType, Amount, Channel, and TransactionStatus.",
    "difficulty": "Beginner",
    "topic": "INNER JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return TransactionID, AccountType, TransactionType, Amount, Channel, and TransactionStatus."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested INNER JOIN pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how INNER JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT t.TransactionID,\n       a.AccountType,\n       t.TransactionType,\n       t.Amount,\n       t.Channel,\n       t.TransactionStatus\nFROM Transactions AS t\nINNER JOIN Accounts AS a\n    ON t.AccountID = a.AccountID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 50,
    "title": "Customer names on events",
    "description": "Return EventID, FirstName, LastName, EventName, Channel, and DeviceType.",
    "difficulty": "Beginner",
    "topic": "INNER JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return EventID, FirstName, LastName, EventName, Channel, and DeviceType."
    ],
    "guidance": {
      "Completely New": "Identify the result grain before writing SELECT.",
      "Know the Basics": "Use the requested INNER JOIN pattern and keep aliases readable.",
      "Comfortable With SQL": "Check whether the prompt asks for sorting or exact output column names.",
      "Interview Preparation": "Explain how INNER JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT e.EventID,\n       c.FirstName,\n       c.LastName,\n       e.EventName,\n       e.Channel,\n       e.DeviceType\nFROM CustomerEvents AS e\nINNER JOIN Customers AS c\n    ON e.CustomerID = c.CustomerID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 51,
    "title": "Branch names on monthly targets",
    "description": "Return Month, BranchName, ApplicationsTarget, ApprovalsTarget, and RevenueTarget.",
    "difficulty": "Beginner",
    "topic": "INNER JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return Month, BranchName, ApplicationsTarget, ApprovalsTarget, and RevenueTarget."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how INNER JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT m.Month,\n       b.BranchName,\n       m.ApplicationsTarget,\n       m.ApprovalsTarget,\n       m.RevenueTarget\nFROM MonthlyTargets AS m\nINNER JOIN Branches AS b\n    ON m.BranchID = b.BranchID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 52,
    "title": "Customer names on applications",
    "description": "Return ApplicationID, FirstName, LastName, RequestedAmount, Status, and RiskScore.",
    "difficulty": "Beginner",
    "topic": "INNER JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return ApplicationID, FirstName, LastName, RequestedAmount, Status, and RiskScore."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how INNER JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT a.ApplicationID,\n       c.FirstName,\n       c.LastName,\n       a.RequestedAmount,\n       a.Status,\n       a.RiskScore\nFROM Applications AS a\nINNER JOIN Customers AS c\n    ON a.CustomerID = c.CustomerID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 53,
    "title": "Three-table payment detail",
    "description": "Return PaymentID, customer FirstName and LastName, LoanAmount, PaymentDate, Amount, and PaymentStatus.",
    "difficulty": "Beginner",
    "topic": "Three-table INNER JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return PaymentID, customer FirstName and LastName, LoanAmount, PaymentDate, Amount, and PaymentStatus."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Three-table INNER JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT p.PaymentID,\n       c.FirstName,\n       c.LastName,\n       l.LoanAmount,\n       p.PaymentDate,\n       p.Amount,\n       p.PaymentStatus\nFROM Payments AS p\nINNER JOIN Loans AS l\n    ON p.LoanID = l.LoanID\nINNER JOIN Customers AS c\n    ON l.CustomerID = c.CustomerID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 54,
    "title": "Application review file",
    "description": "Return ApplicationID, customer FirstName and LastName, BranchName, RequestedAmount, Status, and RiskScore.",
    "difficulty": "Beginner",
    "topic": "Three-table JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return ApplicationID, customer FirstName and LastName, BranchName, RequestedAmount, Status, and RiskScore."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Three-table JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT a.ApplicationID,\n       c.FirstName,\n       c.LastName,\n       b.BranchName,\n       a.RequestedAmount,\n       a.Status,\n       a.RiskScore\nFROM Applications AS a\nINNER JOIN Customers AS c\n    ON a.CustomerID = c.CustomerID\nINNER JOIN Branches AS b\n    ON a.BranchID = b.BranchID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 55,
    "title": "Loan servicing file",
    "description": "Return LoanID, customer FirstName and LastName, BranchName, LoanAmount, InterestRate, and LoanStatus.",
    "difficulty": "Beginner",
    "topic": "Three-table JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return LoanID, customer FirstName and LastName, BranchName, LoanAmount, InterestRate, and LoanStatus."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Three-table JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT l.LoanID,\n       c.FirstName,\n       c.LastName,\n       b.BranchName,\n       l.LoanAmount,\n       l.InterestRate,\n       l.LoanStatus\nFROM Loans AS l\nINNER JOIN Customers AS c\n    ON l.CustomerID = c.CustomerID\nINNER JOIN Branches AS b\n    ON l.BranchID = b.BranchID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 56,
    "title": "Account product portfolio",
    "description": "Return AccountID, customer FirstName and LastName, ProductName, AccountType, Balance, and AccountStatus.",
    "difficulty": "Beginner",
    "topic": "Three-table JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return AccountID, customer FirstName and LastName, ProductName, AccountType, Balance, and AccountStatus."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Three-table JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT a.AccountID,\n       c.FirstName,\n       c.LastName,\n       p.ProductName,\n       a.AccountType,\n       a.Balance,\n       a.AccountStatus\nFROM Accounts AS a\nINNER JOIN Customers AS c\n    ON a.CustomerID = c.CustomerID\nINNER JOIN Products AS p\n    ON a.ProductID = p.ProductID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 57,
    "title": "Customer transaction detail",
    "description": "Return TransactionID, customer FirstName and LastName, AccountType, TransactionType, Amount, Channel, and TransactionStatus.",
    "difficulty": "Beginner",
    "topic": "Three-table JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return TransactionID, customer FirstName and LastName, AccountType, TransactionType, Amount, Channel, and TransactionStatus."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Three-table JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT t.TransactionID,\n       c.FirstName,\n       c.LastName,\n       a.AccountType,\n       t.TransactionType,\n       t.Amount,\n       t.Channel,\n       t.TransactionStatus\nFROM Transactions AS t\nINNER JOIN Accounts AS a\n    ON t.AccountID = a.AccountID\nINNER JOIN Customers AS c\n    ON a.CustomerID = c.CustomerID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 58,
    "title": "Events with missing products preserved",
    "description": "Return EventID, EventName, ProductName, Channel, and DeviceType for every customer event, including events that do not have a ProductID.",
    "difficulty": "Beginner",
    "topic": "LEFT JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return EventID, EventName, ProductName, Channel, and DeviceType for every customer event, including events that do not have a ProductID."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how LEFT JOIN answers the business request before you run the query."
    },
    "reference_sql": "SELECT e.EventID,\n       e.EventName,\n       p.ProductName,\n       e.Channel,\n       e.DeviceType\nFROM CustomerEvents AS e\nLEFT JOIN Products AS p\n    ON e.ProductID = p.ProductID;",
    "comparison_mode": "unordered"
  },
  {
    "id": 59,
    "title": "Application count by branch",
    "description": "Return BranchName and ApplicationCount for every branch that has applications.",
    "difficulty": "Beginner",
    "topic": "JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return BranchName and ApplicationCount for every branch that has applications.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how JOIN, GROUP BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT b.BranchName,\n       COUNT(*) AS ApplicationCount\nFROM Applications AS a\nINNER JOIN Branches AS b\n    ON a.BranchID = b.BranchID\nGROUP BY b.BranchName\nORDER BY ApplicationCount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 60,
    "title": "Approved applications by branch",
    "description": "Return BranchName and ApprovedApplicationCount for approved applications only.",
    "difficulty": "Beginner",
    "topic": "JOIN",
    "starter_sql": "",
    "concept": "JOINs connect related SQLBank tables so reports can include IDs, names, products, branches, and activity details together.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return BranchName and ApprovedApplicationCount for approved applications only.",
      "Apply every requested filter.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how JOIN, WHERE, GROUP BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT b.BranchName,\n       COUNT(*) AS ApprovedApplicationCount\nFROM Applications AS a\nINNER JOIN Branches AS b\n    ON a.BranchID = b.BranchID\nWHERE a.Status = 'Approved'\nGROUP BY b.BranchName\nORDER BY ApprovedApplicationCount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 61,
    "title": "Total loan amount by branch",
    "description": "Return BranchName and TotalLoanAmount for each branch.",
    "difficulty": "Beginner",
    "topic": "JOIN",
    "starter_sql": "",
    "concept": "CASE expressions convert raw values into business labels directly in the query result.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return BranchName and TotalLoanAmount for each branch.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how JOIN, SUM, GROUP BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT b.BranchName,\n       SUM(l.LoanAmount) AS TotalLoanAmount\nFROM Loans AS l\nINNER JOIN Branches AS b\n    ON l.BranchID = b.BranchID\nGROUP BY b.BranchName\nORDER BY TotalLoanAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 62,
    "title": "Completed payments by customer",
    "description": "Return CustomerID, FirstName, LastName, and CompletedPaymentAmount for completed payments.",
    "difficulty": "Beginner",
    "topic": "Three-table JOIN",
    "starter_sql": "",
    "concept": "CASE expressions convert raw values into business labels directly in the query result.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return CustomerID, FirstName, LastName, and CompletedPaymentAmount for completed payments.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Three-table JOIN, SUM answers the business request before you run the query."
    },
    "reference_sql": "SELECT c.CustomerID,\n       c.FirstName,\n       c.LastName,\n       SUM(p.Amount) AS CompletedPaymentAmount\nFROM Payments AS p\nINNER JOIN Loans AS l\n    ON p.LoanID = l.LoanID\nINNER JOIN Customers AS c\n    ON l.CustomerID = c.CustomerID\nWHERE p.PaymentStatus = 'Completed'\nGROUP BY c.CustomerID, c.FirstName, c.LastName\nORDER BY CompletedPaymentAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 63,
    "title": "Transaction amount by customer",
    "description": "Return CustomerID, FirstName, LastName, and TotalTransactionAmount for successful transactions.",
    "difficulty": "Beginner",
    "topic": "Three-table JOIN",
    "starter_sql": "",
    "concept": "CASE expressions convert raw values into business labels directly in the query result.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return CustomerID, FirstName, LastName, and TotalTransactionAmount for successful transactions.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Three-table JOIN, SUM answers the business request before you run the query."
    },
    "reference_sql": "SELECT c.CustomerID,\n       c.FirstName,\n       c.LastName,\n       SUM(t.Amount) AS TotalTransactionAmount\nFROM Transactions AS t\nINNER JOIN Accounts AS a\n    ON t.AccountID = a.AccountID\nINNER JOIN Customers AS c\n    ON a.CustomerID = c.CustomerID\nWHERE t.TransactionStatus = 'Successful'\nGROUP BY c.CustomerID, c.FirstName, c.LastName\nORDER BY TotalTransactionAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 64,
    "title": "Total account balance by customer",
    "description": "Return CustomerID, FirstName, LastName, and TotalBalance across each customer's accounts.",
    "difficulty": "Beginner",
    "topic": "JOIN",
    "starter_sql": "",
    "concept": "CASE expressions convert raw values into business labels directly in the query result.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return CustomerID, FirstName, LastName, and TotalBalance across each customer's accounts.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how JOIN, SUM answers the business request before you run the query."
    },
    "reference_sql": "SELECT c.CustomerID,\n       c.FirstName,\n       c.LastName,\n       SUM(a.Balance) AS TotalBalance\nFROM Customers AS c\nINNER JOIN Accounts AS a\n    ON c.CustomerID = a.CustomerID\nGROUP BY c.CustomerID, c.FirstName, c.LastName\nORDER BY TotalBalance DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 65,
    "title": "Customers with no loans",
    "description": "Return CustomerID, FirstName, LastName, and Province for customers who do not have a matching loan.",
    "difficulty": "Beginner",
    "topic": "LEFT JOIN",
    "starter_sql": "",
    "concept": "CASE expressions convert raw values into business labels directly in the query result.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return CustomerID, FirstName, LastName, and Province for customers who do not have a matching loan."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how LEFT JOIN, IS NULL answers the business request before you run the query."
    },
    "reference_sql": "SELECT c.CustomerID,\n       c.FirstName,\n       c.LastName,\n       c.Province\nFROM Customers AS c\nLEFT JOIN Loans AS l\n    ON c.CustomerID = l.CustomerID\nWHERE l.LoanID IS NULL;",
    "comparison_mode": "unordered"
  },
  {
    "id": 66,
    "title": "Application size bands",
    "description": "Return ApplicationID, RequestedAmount, and AmountBand.\r\nUse:\r\n- below 10000 = Small\r\n- below 25000 = Medium\r\n- everything else = Large",
    "difficulty": "Beginner",
    "topic": "CASE",
    "starter_sql": "",
    "concept": "CASE expressions convert raw values into business labels directly in the query result.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnName,\n       CASE WHEN ColumnName = 'Value' THEN 'Label' ELSE 'Other' END AS LabelName\nFROM TableName;",
    "success_criteria": [
      "Return ApplicationID, RequestedAmount, and AmountBand."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how CASE answers the business request before you run the query."
    },
    "reference_sql": "SELECT ApplicationID,\n       RequestedAmount,\n       CASE\n           WHEN RequestedAmount < 10000 THEN 'Small'\n           WHEN RequestedAmount < 25000 THEN 'Medium'\n           ELSE 'Large'\n       END AS AmountBand\nFROM Applications;",
    "comparison_mode": "unordered"
  },
  {
    "id": 67,
    "title": "Risk-score bands",
    "description": "Return ApplicationID, RiskScore, and RiskBand.\r\nUse:\r\n- below 600 = Review\r\n- below 700 = Standard\r\n- 700 or higher = Strong",
    "difficulty": "Beginner",
    "topic": "CASE",
    "starter_sql": "",
    "concept": "CASE expressions convert raw values into business labels directly in the query result.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnName,\n       CASE WHEN ColumnName = 'Value' THEN 'Label' ELSE 'Other' END AS LabelName\nFROM TableName;",
    "success_criteria": [
      "Return ApplicationID, RiskScore, and RiskBand."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how CASE answers the business request before you run the query."
    },
    "reference_sql": "SELECT ApplicationID,\n       RiskScore,\n       CASE\n           WHEN RiskScore < 600 THEN 'Review'\n           WHEN RiskScore < 700 THEN 'Standard'\n           ELSE 'Strong'\n       END AS RiskBand\nFROM Applications;",
    "comparison_mode": "unordered"
  },
  {
    "id": 68,
    "title": "Simplify loan status",
    "description": "Return LoanID, LoanStatus, and PortfolioGroup.\r\nActive and Delinquent loans should be labelled Open Portfolio.\r\nAll other statuses should be labelled Closed Portfolio.",
    "difficulty": "Beginner",
    "topic": "CASE",
    "starter_sql": "",
    "concept": "CASE expressions convert raw values into business labels directly in the query result.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnName,\n       CASE WHEN ColumnName = 'Value' THEN 'Label' ELSE 'Other' END AS LabelName\nFROM TableName;",
    "success_criteria": [
      "Return LoanID, LoanStatus, and PortfolioGroup."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how CASE, IN answers the business request before you run the query."
    },
    "reference_sql": "SELECT LoanID,\n       LoanStatus,\n       CASE\n           WHEN LoanStatus IN ('Active', 'Delinquent')\n               THEN 'Open Portfolio'\n           ELSE 'Closed Portfolio'\n       END AS PortfolioGroup\nFROM Loans;",
    "comparison_mode": "unordered"
  },
  {
    "id": 69,
    "title": "Payment health",
    "description": "Return PaymentID, PaymentStatus, and PaymentHealth.\r\nUse:\r\n- Completed = Healthy\r\n- Late = Watch\r\n- everything else = Action Required",
    "difficulty": "Beginner",
    "topic": "CASE",
    "starter_sql": "",
    "concept": "CASE expressions convert raw values into business labels directly in the query result.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnName,\n       CASE WHEN ColumnName = 'Value' THEN 'Label' ELSE 'Other' END AS LabelName\nFROM TableName;",
    "success_criteria": [
      "Return PaymentID, PaymentStatus, and PaymentHealth."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how CASE answers the business request before you run the query."
    },
    "reference_sql": "SELECT PaymentID,\n       PaymentStatus,\n       CASE\n           WHEN PaymentStatus = 'Completed' THEN 'Healthy'\n           WHEN PaymentStatus = 'Late' THEN 'Watch'\n           ELSE 'Action Required'\n       END AS PaymentHealth\nFROM Payments;",
    "comparison_mode": "unordered"
  },
  {
    "id": 70,
    "title": "Open and closed accounts",
    "description": "Return AccountID, ClosedDate, and ClosureState.\r\nIf ClosedDate is NULL, label the account Open.\r\nOtherwise label it Closed.",
    "difficulty": "Beginner",
    "topic": "CASE",
    "starter_sql": "",
    "concept": "CASE expressions convert raw values into business labels directly in the query result.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnName,\n       CASE WHEN ColumnName = 'Value' THEN 'Label' ELSE 'Other' END AS LabelName\nFROM TableName;",
    "success_criteria": [
      "Return AccountID, ClosedDate, and ClosureState."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how CASE, NULL answers the business request before you run the query."
    },
    "reference_sql": "SELECT AccountID,\n       ClosedDate,\n       CASE\n           WHEN ClosedDate IS NULL THEN 'Open'\n           ELSE 'Closed'\n       END AS ClosureState\nFROM Accounts;",
    "comparison_mode": "unordered"
  },
  {
    "id": 71,
    "title": "Product context on events",
    "description": "Return EventID, EventName, ProductID, and ProductContext.\r\nIf ProductID is NULL, use No Product.\r\nOtherwise use Product Linked.",
    "difficulty": "Beginner",
    "topic": "CASE",
    "starter_sql": "",
    "concept": "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnName,\n       CASE WHEN ColumnName = 'Value' THEN 'Label' ELSE 'Other' END AS LabelName\nFROM TableName;",
    "success_criteria": [
      "Return EventID, EventName, ProductID, and ProductContext."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how CASE, NULL answers the business request before you run the query."
    },
    "reference_sql": "SELECT EventID,\n       EventName,\n       ProductID,\n       CASE\n           WHEN ProductID IS NULL THEN 'No Product'\n           ELSE 'Product Linked'\n       END AS ProductContext\nFROM CustomerEvents;",
    "comparison_mode": "unordered"
  },
  {
    "id": 72,
    "title": "Applications created in 2025",
    "description": "Return ApplicationID, CustomerID, ApplicationDate, RequestedAmount, and Status for applications created during 2025.",
    "difficulty": "Beginner",
    "topic": "Date range",
    "starter_sql": "",
    "concept": "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return ApplicationID, CustomerID, ApplicationDate, RequestedAmount, and Status for applications created during 2025.",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Date range answers the business request before you run the query."
    },
    "reference_sql": "SELECT ApplicationID,\n       CustomerID,\n       ApplicationDate,\n       RequestedAmount,\n       Status\nFROM Applications\nWHERE ApplicationDate >= '2025-01-01'\n  AND ApplicationDate < '2026-01-01';",
    "comparison_mode": "unordered"
  },
  {
    "id": 73,
    "title": "Loans started in 2025",
    "description": "Return LoanID, CustomerID, StartDate, LoanAmount, and LoanStatus for loans started during 2025.",
    "difficulty": "Beginner",
    "topic": "Date range",
    "starter_sql": "",
    "concept": "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return LoanID, CustomerID, StartDate, LoanAmount, and LoanStatus for loans started during 2025.",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Date range answers the business request before you run the query."
    },
    "reference_sql": "SELECT LoanID,\n       CustomerID,\n       StartDate,\n       LoanAmount,\n       LoanStatus\nFROM Loans\nWHERE StartDate >= '2025-01-01'\n  AND StartDate < '2026-01-01';",
    "comparison_mode": "unordered"
  },
  {
    "id": 74,
    "title": "Payments made in 2026",
    "description": "Return PaymentID, LoanID, PaymentDate, Amount, and PaymentStatus for payments made during 2026.",
    "difficulty": "Beginner",
    "topic": "Date range",
    "starter_sql": "",
    "concept": "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return PaymentID, LoanID, PaymentDate, Amount, and PaymentStatus for payments made during 2026.",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Date range answers the business request before you run the query."
    },
    "reference_sql": "SELECT PaymentID,\n       LoanID,\n       PaymentDate,\n       Amount,\n       PaymentStatus\nFROM Payments\nWHERE PaymentDate >= '2026-01-01'\n  AND PaymentDate < '2027-01-01';",
    "comparison_mode": "unordered"
  },
  {
    "id": 75,
    "title": "Q1 2026 transactions",
    "description": "Return TransactionID, AccountID, TransactionDate, TransactionType, Amount, and Channel for transactions from January through March 2026.",
    "difficulty": "Beginner",
    "topic": "Date range",
    "starter_sql": "",
    "concept": "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return TransactionID, AccountID, TransactionDate, TransactionType, Amount, and Channel for transactions from January through March 2026."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Date range answers the business request before you run the query."
    },
    "reference_sql": "SELECT TransactionID,\n       AccountID,\n       TransactionDate,\n       TransactionType,\n       Amount,\n       Channel\nFROM Transactions\nWHERE TransactionDate >= '2026-01-01'\n  AND TransactionDate < '2026-04-01';",
    "comparison_mode": "unordered"
  },
  {
    "id": 76,
    "title": "Long-standing customers",
    "description": "Return CustomerID, FirstName, LastName, and CustomerSince for customers who joined before 2020-01-01.",
    "difficulty": "Beginner",
    "topic": "Date comparison",
    "starter_sql": "",
    "concept": "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return CustomerID, FirstName, LastName, and CustomerSince for customers who joined before 2020-01-01.",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Date comparison answers the business request before you run the query."
    },
    "reference_sql": "SELECT CustomerID,\n       FirstName,\n       LastName,\n       CustomerSince\nFROM Customers\nWHERE CustomerSince < '2020-01-01';",
    "comparison_mode": "unordered"
  },
  {
    "id": 77,
    "title": "Campaigns active on a date",
    "description": "Return CampaignID, CampaignName, StartDate, EndDate, and Channel for campaigns that were active on June 15, 2025.",
    "difficulty": "Beginner",
    "topic": "Date overlap logic",
    "starter_sql": "",
    "concept": "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnA, ColumnB\nFROM TableName\nWHERE ColumnA = 'Value';",
    "success_criteria": [
      "Return CampaignID, CampaignName, StartDate, EndDate, and Channel for campaigns that were active on June 15, 2025.",
      "Apply every requested filter."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Date overlap logic answers the business request before you run the query."
    },
    "reference_sql": "SELECT CampaignID,\n       CampaignName,\n       StartDate,\n       EndDate,\n       Channel\nFROM Campaigns\nWHERE StartDate <= '2025-06-15'\n  AND EndDate >= '2025-06-15';",
    "comparison_mode": "unordered"
  },
  {
    "id": 78,
    "title": "Regional customer distribution",
    "description": "Return Province, CustomerCount, and ActiveCustomerCount.",
    "difficulty": "Beginner",
    "topic": "Conditional aggregation",
    "starter_sql": "",
    "concept": "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnName,\n       CASE WHEN ColumnName = 'Value' THEN 'Label' ELSE 'Other' END AS LabelName\nFROM TableName;",
    "success_criteria": [
      "Return Province, CustomerCount, and ActiveCustomerCount.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Conditional aggregation answers the business request before you run the query."
    },
    "reference_sql": "SELECT Province,\n       COUNT(*) AS CustomerCount,\n       SUM(\n           CASE\n               WHEN CustomerStatus = 'Active' THEN 1\n               ELSE 0\n           END\n       ) AS ActiveCustomerCount\nFROM Customers\nGROUP BY Province\nORDER BY CustomerCount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 79,
    "title": "Account status by type",
    "description": "Return AccountType, AccountCount, and ActiveAccountCount.",
    "difficulty": "Beginner",
    "topic": "Conditional aggregation",
    "starter_sql": "",
    "concept": "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT ColumnName,\n       CASE WHEN ColumnName = 'Value' THEN 'Label' ELSE 'Other' END AS LabelName\nFROM TableName;",
    "success_criteria": [
      "Return AccountType, AccountCount, and ActiveAccountCount.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Conditional aggregation answers the business request before you run the query."
    },
    "reference_sql": "SELECT AccountType,\n       COUNT(*) AS AccountCount,\n       SUM(\n           CASE\n               WHEN AccountStatus = 'Active' THEN 1\n               ELSE 0\n           END\n       ) AS ActiveAccountCount\nFROM Accounts\nGROUP BY AccountType\nORDER BY AccountCount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 80,
    "title": "Branch lending summary",
    "description": "Return BranchName, LoanCount, TotalLoanAmount, and AverageInterestRate.",
    "difficulty": "Beginner",
    "topic": "JOIN",
    "starter_sql": "",
    "concept": "Date filters and conditional aggregation help analysts answer time-bound and status-specific business questions.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return BranchName, LoanCount, TotalLoanAmount, and AverageInterestRate.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Map each requested output column to its source table or expression.",
      "Know the Basics": "Build joins and grouping before refining the final SELECT list.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how JOIN, multiple aggregates answers the business request before you run the query."
    },
    "reference_sql": "SELECT b.BranchName,\n       COUNT(*) AS LoanCount,\n       SUM(l.LoanAmount) AS TotalLoanAmount,\n       AVG(l.InterestRate) AS AverageInterestRate\nFROM Loans AS l\nINNER JOIN Branches AS b\n    ON l.BranchID = b.BranchID\nGROUP BY b.BranchName\nORDER BY TotalLoanAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 81,
    "title": "Completed payments by loan status",
    "description": "Return LoanStatus and CompletedPaymentAmount using completed payments only.",
    "difficulty": "Beginner",
    "topic": "JOIN",
    "starter_sql": "",
    "concept": "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return LoanStatus and CompletedPaymentAmount using completed payments only.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Keep the report grain aligned with the business request.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how JOIN, WHERE, SUM, GROUP BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT l.LoanStatus,\n       SUM(p.Amount) AS CompletedPaymentAmount\nFROM Payments AS p\nINNER JOIN Loans AS l\n    ON p.LoanID = l.LoanID\nWHERE p.PaymentStatus = 'Completed'\nGROUP BY l.LoanStatus\nORDER BY CompletedPaymentAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 82,
    "title": "Applications by product",
    "description": "Return ProductName and ApplicationCount.",
    "difficulty": "Beginner",
    "topic": "JOIN",
    "starter_sql": "",
    "concept": "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return ProductName and ApplicationCount.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Keep the report grain aligned with the business request.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how JOIN, GROUP BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT p.ProductName,\n       COUNT(*) AS ApplicationCount\nFROM Applications AS a\nINNER JOIN Products AS p\n    ON a.ProductID = p.ProductID\nGROUP BY p.ProductName\nORDER BY ApplicationCount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 83,
    "title": "Approved applications by product",
    "description": "Return ProductName and ApprovedApplicationCount for approved applications only.",
    "difficulty": "Beginner",
    "topic": "JOIN",
    "starter_sql": "",
    "concept": "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return ProductName and ApprovedApplicationCount for approved applications only.",
      "Apply every requested filter.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Keep the report grain aligned with the business request.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how JOIN, WHERE, GROUP BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT p.ProductName,\n       COUNT(*) AS ApprovedApplicationCount\nFROM Applications AS a\nINNER JOIN Products AS p\n    ON a.ProductID = p.ProductID\nWHERE a.Status = 'Approved'\nGROUP BY p.ProductName\nORDER BY ApprovedApplicationCount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 84,
    "title": "Transaction performance by channel",
    "description": "Return Channel, TransactionCount, and TotalTransactionAmount for successful transactions.",
    "difficulty": "Beginner",
    "topic": "WHERE",
    "starter_sql": "",
    "concept": "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT CategoryColumn, COUNT(*) AS ItemCount\nFROM TableName\nGROUP BY CategoryColumn;",
    "success_criteria": [
      "Return Channel, TransactionCount, and TotalTransactionAmount for successful transactions.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Keep the report grain aligned with the business request.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how WHERE, GROUP BY, COUNT, SUM answers the business request before you run the query."
    },
    "reference_sql": "SELECT Channel,\n       COUNT(*) AS TransactionCount,\n       SUM(Amount) AS TotalTransactionAmount\nFROM Transactions\nWHERE TransactionStatus = 'Successful'\nGROUP BY Channel\nORDER BY TotalTransactionAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 85,
    "title": "Merchant-category transaction value",
    "description": "Return MerchantCategory, TransactionCount, and TotalAmount for successful transactions.",
    "difficulty": "Beginner",
    "topic": "WHERE",
    "starter_sql": "",
    "concept": "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT CategoryColumn, COUNT(*) AS ItemCount\nFROM TableName\nGROUP BY CategoryColumn;",
    "success_criteria": [
      "Return MerchantCategory, TransactionCount, and TotalAmount for successful transactions.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Keep the report grain aligned with the business request.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how WHERE, GROUP BY, COUNT, SUM answers the business request before you run the query."
    },
    "reference_sql": "SELECT MerchantCategory,\n       COUNT(*) AS TransactionCount,\n       SUM(Amount) AS TotalAmount\nFROM Transactions\nWHERE TransactionStatus = 'Successful'\nGROUP BY MerchantCategory\nORDER BY TotalAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 86,
    "title": "Customer acquisition mix",
    "description": "Return AcquisitionChannel and CustomerCount.",
    "difficulty": "Beginner",
    "topic": "GROUP BY",
    "starter_sql": "",
    "concept": "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT CategoryColumn, COUNT(*) AS ItemCount\nFROM TableName\nGROUP BY CategoryColumn;",
    "success_criteria": [
      "Return AcquisitionChannel and CustomerCount.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Keep the report grain aligned with the business request.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how GROUP BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT AcquisitionChannel,\n       COUNT(*) AS CustomerCount\nFROM Customers\nGROUP BY AcquisitionChannel\nORDER BY CustomerCount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 87,
    "title": "Balance by customer segment",
    "description": "Return CustomerSegment and AverageBalance using Customers joined to Accounts.",
    "difficulty": "Beginner",
    "topic": "JOIN",
    "starter_sql": "",
    "concept": "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return CustomerSegment and AverageBalance using Customers joined to Accounts.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Keep the report grain aligned with the business request.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how JOIN, AVG, GROUP BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT c.CustomerSegment,\n       AVG(a.Balance) AS AverageBalance\nFROM Customers AS c\nINNER JOIN Accounts AS a\n    ON c.CustomerID = a.CustomerID\nGROUP BY c.CustomerSegment\nORDER BY AverageBalance DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 88,
    "title": "Monthly company targets",
    "description": "Return Month, TotalApplicationsTarget, TotalApprovalsTarget, and TotalRevenueTarget across all branches.",
    "difficulty": "Beginner",
    "topic": "GROUP BY",
    "starter_sql": "",
    "concept": "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT CategoryColumn, COUNT(*) AS ItemCount\nFROM TableName\nGROUP BY CategoryColumn;",
    "success_criteria": [
      "Return Month, TotalApplicationsTarget, TotalApprovalsTarget, and TotalRevenueTarget across all branches.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Keep the report grain aligned with the business request.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how GROUP BY, SUM answers the business request before you run the query."
    },
    "reference_sql": "SELECT Month,\n       SUM(ApplicationsTarget) AS TotalApplicationsTarget,\n       SUM(ApprovalsTarget) AS TotalApprovalsTarget,\n       SUM(RevenueTarget) AS TotalRevenueTarget\nFROM MonthlyTargets\nGROUP BY Month\nORDER BY Month;",
    "comparison_mode": "ordered"
  },
  {
    "id": 89,
    "title": "Branch approval rate",
    "description": "Return BranchName, ApplicationCount, ApprovedCount, and ApprovalRatePct.",
    "difficulty": "Beginner",
    "topic": "JOIN",
    "starter_sql": "",
    "concept": "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return BranchName, ApplicationCount, ApprovedCount, and ApprovalRatePct.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Keep the report grain aligned with the business request.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how JOIN, conditional aggregation, arithmetic answers the business request before you run the query."
    },
    "reference_sql": "SELECT b.BranchName,\n       COUNT(*) AS ApplicationCount,\n       SUM(\n           CASE\n               WHEN a.Status = 'Approved' THEN 1\n               ELSE 0\n           END\n       ) AS ApprovedCount,\n       100.0 *\n       SUM(\n           CASE\n               WHEN a.Status = 'Approved' THEN 1\n               ELSE 0\n           END\n       ) / COUNT(*) AS ApprovalRatePct\nFROM Applications AS a\nINNER JOIN Branches AS b\n    ON a.BranchID = b.BranchID\nGROUP BY b.BranchName\nORDER BY ApprovalRatePct DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 90,
    "title": "Approved requested amount by branch",
    "description": "Return BranchName, ApprovedApplicationCount, and ApprovedRequestedAmount for approved applications.",
    "difficulty": "Beginner",
    "topic": "JOIN",
    "starter_sql": "",
    "concept": "Analyst reports combine filters, joins, grouping, and calculations while keeping the output grain clear.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return BranchName, ApprovedApplicationCount, and ApprovedRequestedAmount for approved applications.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Keep the report grain aligned with the business request.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how JOIN, WHERE, COUNT, SUM, GROUP BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT b.BranchName,\n       COUNT(*) AS ApprovedApplicationCount,\n       SUM(a.RequestedAmount) AS ApprovedRequestedAmount\nFROM Applications AS a\nINNER JOIN Branches AS b\n    ON a.BranchID = b.BranchID\nWHERE a.Status = 'Approved'\nGROUP BY b.BranchName\nORDER BY ApprovedRequestedAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 91,
    "title": "Top customers by loan amount",
    "description": "SQLBank wants to identify its largest lending relationships.\r\nReturn the 10 customers with the largest total LoanAmount.\r\nInclude:\r\n- CustomerID\r\n- FirstName\r\n- LastName\r\n- TotalLoanAmount",
    "difficulty": "Beginner",
    "topic": "JOIN",
    "starter_sql": "",
    "concept": "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return the 10 customers with the largest total LoanAmount.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Break the analyst request into output columns, source tables, filters, grouping, and ordering.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how JOIN, GROUP BY, SUM, TOP answers the business request before you run the query."
    },
    "reference_sql": "SELECT TOP 10\n       c.CustomerID,\n       c.FirstName,\n       c.LastName,\n       SUM(l.LoanAmount) AS TotalLoanAmount\nFROM Customers AS c\nINNER JOIN Loans AS l\n    ON c.CustomerID = l.CustomerID\nGROUP BY c.CustomerID, c.FirstName, c.LastName\nORDER BY TotalLoanAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 92,
    "title": "Customers with active accounts and loans",
    "description": "Return distinct CustomerID, FirstName, and LastName for customers who have at least one active account and at least one active loan.",
    "difficulty": "Beginner",
    "topic": "Three-table JOIN",
    "starter_sql": "",
    "concept": "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT a.ColumnOne, b.ColumnTwo\nFROM TableA AS a\nINNER JOIN TableB AS b\n    ON a.SharedID = b.SharedID;",
    "success_criteria": [
      "Return distinct CustomerID, FirstName, and LastName for customers who have at least one active account and at least one active loan."
    ],
    "guidance": {
      "Completely New": "Break the analyst request into output columns, source tables, filters, grouping, and ordering.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Three-table JOIN, WHERE, DISTINCT answers the business request before you run the query."
    },
    "reference_sql": "SELECT DISTINCT\n       c.CustomerID,\n       c.FirstName,\n       c.LastName\nFROM Customers AS c\nINNER JOIN Accounts AS a\n    ON c.CustomerID = a.CustomerID\nINNER JOIN Loans AS l\n    ON c.CustomerID = l.CustomerID\nWHERE a.AccountStatus = 'Active'\n  AND l.LoanStatus = 'Active';",
    "comparison_mode": "unordered"
  },
  {
    "id": 93,
    "title": "Completed payments by branch",
    "description": "Operations wants to understand how much completed payment value each branch is servicing.\r\nReturn BranchName and CompletedPaymentAmount.\r\nOnly include completed payments.",
    "difficulty": "Beginner",
    "topic": "Three-table JOIN",
    "starter_sql": "",
    "concept": "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return BranchName and CompletedPaymentAmount.",
      "Apply every requested filter.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Break the analyst request into output columns, source tables, filters, grouping, and ordering.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Three-table JOIN, SUM, WHERE, GROUP BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT b.BranchName,\n       SUM(p.Amount) AS CompletedPaymentAmount\nFROM Payments AS p\nINNER JOIN Loans AS l\n    ON p.LoanID = l.LoanID\nINNER JOIN Branches AS b\n    ON l.BranchID = b.BranchID\nWHERE p.PaymentStatus = 'Completed'\nGROUP BY b.BranchName\nORDER BY CompletedPaymentAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 94,
    "title": "Product account balances",
    "description": "Return ProductName, AccountCount, and TotalBalance for accounts associated with each product.",
    "difficulty": "Beginner",
    "topic": "JOIN",
    "starter_sql": "",
    "concept": "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return ProductName, AccountCount, and TotalBalance for accounts associated with each product.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Break the analyst request into output columns, source tables, filters, grouping, and ordering.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how JOIN, COUNT, SUM, GROUP BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT p.ProductName,\n       COUNT(*) AS AccountCount,\n       SUM(a.Balance) AS TotalBalance\nFROM Accounts AS a\nINNER JOIN Products AS p\n    ON a.ProductID = p.ProductID\nGROUP BY p.ProductName\nORDER BY TotalBalance DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 95,
    "title": "Transaction activity by customer segment",
    "description": "Return CustomerSegment, TransactionCount, and TotalTransactionAmount for successful transactions.",
    "difficulty": "Beginner",
    "topic": "Three-table JOIN",
    "starter_sql": "",
    "concept": "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return CustomerSegment, TransactionCount, and TotalTransactionAmount for successful transactions.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Break the analyst request into output columns, source tables, filters, grouping, and ordering.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Three-table JOIN, GROUP BY, COUNT, SUM answers the business request before you run the query."
    },
    "reference_sql": "SELECT c.CustomerSegment,\n       COUNT(*) AS TransactionCount,\n       SUM(t.Amount) AS TotalTransactionAmount\nFROM Transactions AS t\nINNER JOIN Accounts AS a\n    ON t.AccountID = a.AccountID\nINNER JOIN Customers AS c\n    ON a.CustomerID = c.CustomerID\nWHERE t.TransactionStatus = 'Successful'\nGROUP BY c.CustomerSegment\nORDER BY TotalTransactionAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 96,
    "title": "Mobile activity by customer segment",
    "description": "Return CustomerSegment, TransactionCount, and TotalAmount for successful Mobile transactions.",
    "difficulty": "Beginner",
    "topic": "Three-table JOIN",
    "starter_sql": "",
    "concept": "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return CustomerSegment, TransactionCount, and TotalAmount for successful Mobile transactions.",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Break the analyst request into output columns, source tables, filters, grouping, and ordering.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Three-table JOIN, multiple filters, GROUP BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT c.CustomerSegment,\n       COUNT(*) AS TransactionCount,\n       SUM(t.Amount) AS TotalAmount\nFROM Transactions AS t\nINNER JOIN Accounts AS a\n    ON t.AccountID = a.AccountID\nINNER JOIN Customers AS c\n    ON a.CustomerID = c.CustomerID\nWHERE t.TransactionStatus = 'Successful'\n  AND t.Channel = 'Mobile'\nGROUP BY c.CustomerSegment\nORDER BY TotalAmount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 97,
    "title": "Annual branch targets",
    "description": "Return BranchName:\r\n- AnnualApplicationsTarget\r\n- AnnualApprovalsTarget\r\n- AnnualRevenueTarget\r\n- AnnualCustomerGrowthTarget",
    "difficulty": "Beginner",
    "topic": "JOIN",
    "starter_sql": "",
    "concept": "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return BranchName:",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Break the analyst request into output columns, source tables, filters, grouping, and ordering.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how JOIN, multiple SUMs, GROUP BY answers the business request before you run the query."
    },
    "reference_sql": "SELECT b.BranchName,\n       SUM(m.ApplicationsTarget) AS AnnualApplicationsTarget,\n       SUM(m.ApprovalsTarget) AS AnnualApprovalsTarget,\n       SUM(m.RevenueTarget) AS AnnualRevenueTarget,\n       SUM(m.CustomerGrowthTarget) AS AnnualCustomerGrowthTarget\nFROM MonthlyTargets AS m\nINNER JOIN Branches AS b\n    ON m.BranchID = b.BranchID\nGROUP BY b.BranchName\nORDER BY AnnualRevenueTarget DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 98,
    "title": "Capstone: Branch payment health",
    "description": "Operations wants a payment-health report for every branch.\r\nReturn:\r\n- BranchName\r\n- PaymentCount\r\n- CompletedCount\r\n- LateCount\r\n- MissedCount\r\n- TotalPaymentAmount\r\nOrder branches by LateCount descending and then MissedCount descending.",
    "difficulty": "Beginner",
    "topic": "Three-table JOIN",
    "starter_sql": "",
    "concept": "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return:",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Break the analyst request into output columns, source tables, filters, grouping, and ordering.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Three-table JOIN, GROUP BY, conditional aggregation answers the business request before you run the query."
    },
    "reference_sql": "SELECT b.BranchName,\n       COUNT(*) AS PaymentCount,\n       SUM(\n           CASE\n               WHEN p.PaymentStatus = 'Completed' THEN 1\n               ELSE 0\n           END\n       ) AS CompletedCount,\n       SUM(\n           CASE\n               WHEN p.PaymentStatus = 'Late' THEN 1\n               ELSE 0\n           END\n       ) AS LateCount,\n       SUM(\n           CASE\n               WHEN p.PaymentStatus = 'Missed' THEN 1\n               ELSE 0\n           END\n       ) AS MissedCount,\n       SUM(p.Amount) AS TotalPaymentAmount\nFROM Payments AS p\nINNER JOIN Loans AS l\n    ON p.LoanID = l.LoanID\nINNER JOIN Branches AS b\n    ON l.BranchID = b.BranchID\nGROUP BY b.BranchName\nORDER BY LateCount DESC, MissedCount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 99,
    "title": "Capstone: Product adoption portfolio",
    "description": "Product leadership wants to understand product adoption across SQLBank.\r\nReturn:\r\n- ProductName\r\n- ProductCategory\r\n- AccountCount\r\n- ActiveAccountCount\r\n- TotalBalance",
    "difficulty": "Beginner",
    "topic": "JOIN",
    "starter_sql": "",
    "concept": "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return:",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Break the analyst request into output columns, source tables, filters, grouping, and ordering.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how JOIN, GROUP BY, conditional aggregation answers the business request before you run the query."
    },
    "reference_sql": "SELECT p.ProductName,\n       p.ProductCategory,\n       COUNT(*) AS AccountCount,\n       SUM(\n           CASE\n               WHEN a.AccountStatus = 'Active' THEN 1\n               ELSE 0\n           END\n       ) AS ActiveAccountCount,\n       SUM(a.Balance) AS TotalBalance\nFROM Accounts AS a\nINNER JOIN Products AS p\n    ON a.ProductID = p.ProductID\nGROUP BY p.ProductName, p.ProductCategory\nORDER BY AccountCount DESC;",
    "comparison_mode": "ordered"
  },
  {
    "id": 100,
    "title": "Final Beginner Capstone: Customer-segment activity",
    "description": "Analytics wants a customer-segment view of successful transaction activity.\r\nReturn:\r\n- CustomerSegment\r\n- TransactionCount\r\n- TotalTransactionAmount\r\n- AverageTransactionAmount\r\nOrder the results by TotalTransactionAmount from highest to lowest.",
    "difficulty": "Beginner",
    "topic": "Three-table JOIN",
    "starter_sql": "",
    "concept": "Beginner capstones combine the SQL patterns already introduced: joins, filters, grouping, aggregates, CASE, and ordered business outputs.",
    "lesson": "Use the existing SQLBank tables exactly as named. The reference SQL is one correct solution, while equivalent queries can pass when they return the same rows, columns, aliases, and required ordering.",
    "example_sql": "SELECT d.Category, COUNT(*) AS ItemCount\nFROM DetailTable AS d\nINNER JOIN LookupTable AS l\n    ON d.LookupID = l.LookupID\nGROUP BY d.Category;",
    "success_criteria": [
      "Return:",
      "Return rows in the requested order.",
      "Use the requested aggregate metric names."
    ],
    "guidance": {
      "Completely New": "Break the analyst request into output columns, source tables, filters, grouping, and ordering.",
      "Know the Basics": "Match the filter, grouping, and sorting requirements in the prompt.",
      "Comfortable With SQL": "Focus on returning the same result shape and row set as the request.",
      "Interview Preparation": "Explain how Three-table JOIN, WHERE, GROUP BY, COUNT, SUM, AVG answers the business request before you run the query."
    },
    "reference_sql": "SELECT c.CustomerSegment,\n       COUNT(*) AS TransactionCount,\n       SUM(t.Amount) AS TotalTransactionAmount,\n       AVG(t.Amount) AS AverageTransactionAmount\nFROM Transactions AS t\nINNER JOIN Accounts AS a\n    ON t.AccountID = a.AccountID\nINNER JOIN Customers AS c\n    ON a.CustomerID = c.CustomerID\nWHERE t.TransactionStatus = 'Successful'\nGROUP BY c.CustomerSegment\nORDER BY TotalTransactionAmount DESC;",
    "comparison_mode": "ordered"
  }
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

class QueryValidationError extends Error {
  errorType: "safety_error" | "dialect_error";

  constructor(errorType: "safety_error" | "dialect_error", message: string) {
    super(message);
    this.name = "QueryValidationError";
    this.errorType = errorType;
  }
}

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
      body: { success: false, correct: false, errorType: error instanceof QueryValidationError ? error.errorType : "safety_error", message: error instanceof Error ? error.message : "Invalid SQL query." },
    };
  }

  try {
    const startedAt = performance.now();
    ensureDatabase();
    const userResult = execute(validated);
    const referenceResult = execute(challenge.reference_sql);
    const evaluation = evaluateQueryResult(userResult, referenceResult, getValidationContract(challenge));
    const correct = evaluation.correct;
    const displayRows = userResult.rows.slice(0, MAX_RESULT_ROWS);

    return {
      status: 200,
      body: {
        success: true,
        correct,
        columns: userResult.columns,
        rows: displayRows,
        executionTimeMs: Math.max(0, Math.round(performance.now() - startedAt)),
        truncated: userResult.rowCount > MAX_RESULT_ROWS,
        rowCount: userResult.rowCount,
        displayedRowCount: displayRows.length,
        message: correct ? null : evaluation.message,
        evaluation,
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

export function runFreeSqlBankQuery(query: string) {
  let validated: string;
  try {
    validated = validateReadOnlyQuery(query);
  } catch (error) {
    return {
      status: 200,
      body: { success: false, correct: false, errorType: error instanceof QueryValidationError ? error.errorType : "safety_error", message: error instanceof Error ? error.message : "Invalid SQL query." },
    };
  }

  try {
    const startedAt = performance.now();
    ensureDatabase();
    const userResult = execute(validated);
    const displayRows = userResult.rows.slice(0, MAX_RESULT_ROWS);

    return {
      status: 200,
      body: {
        success: true,
        correct: true,
        columns: userResult.columns,
        rows: displayRows,
        executionTimeMs: Math.max(0, Math.round(performance.now() - startedAt)),
        truncated: userResult.rowCount > MAX_RESULT_ROWS,
        rowCount: userResult.rowCount,
        displayedRowCount: displayRows.length,
        message: null,
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

export function executeSqlBankQueryForTest(sql: string) {
  const validated = validateReadOnlyQuery(sql);
  ensureDatabase();
  return execute(validated);
}

export function evaluateSqlBankResultForTest(challengeId: number, query: string) {
  const challenge = challenges.find((candidate) => candidate.id === challengeId);
  if (!challenge) throw new Error(`Challenge ${challengeId} was not found.`);
  const userResult = executeSqlBankQueryForTest(query);
  const referenceResult = executeSqlBankQueryForTest(challenge.reference_sql);
  return evaluateQueryResult(userResult, referenceResult, getValidationContract(challenge));
}

export function auditSqlBankCurriculum() {
  ensureDatabase();
  return challenges.map((challenge) => {
    const referenceResult = execute(challenge.reference_sql);
    const evaluation = evaluateQueryResult(referenceResult, referenceResult, getValidationContract(challenge));
    return {
      id: challenge.id,
      title: challenge.title,
      referenceExecutes: true,
      referencePasses: evaluation.correct,
      rowCount: referenceResult.rowCount,
      columns: referenceResult.columns,
      validation: getValidationContract(challenge),
    };
  });
}

function execute(sql: string): NormalizedQueryResult {
  const rows = alasql(normalizeSql(sql)) as Row[];
  const resultRows = Array.isArray(rows) ? rows : [];
  const columns = resultRows[0] ? Object.keys(resultRows[0]) : resolveResultColumns(sql);
  const columnDetails = columns.map((name) => ({ name, normalizedName: normalizeIdentifier(name), dataType: dataTypeForColumn(name) }));
  return {
    columnDetails,
    columns,
    rows: resultRows.map((row) => columns.map((column) => row[column] ?? null)),
    rowCount: resultRows.length,
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
    alasql.tables[table].data = rows as Record<string, string | number>[];
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
  const segments = ["Everyday Banking", "Digital First", "High Value", "New Borrower", "Dormant"];
  const acquisitionChannels = ["Organic", "Paid Search", "Referral", "Branch", "Partner Campaign"];

  const Products: Row[] = [
    { ProductID: 1, ProductName: "Everyday Chequing", ProductCategory: "Deposit", InterestRate: 0.05, LaunchDate: "2018-01-15", ProductStatus: "Active" },
    { ProductID: 2, ProductName: "High Interest Savings", ProductCategory: "Deposit", InterestRate: 3.25, LaunchDate: "2020-06-01", ProductStatus: "Active" },
    { ProductID: 3, ProductName: "Student Banking", ProductCategory: "Deposit", InterestRate: 0.1, LaunchDate: "2019-08-15", ProductStatus: "Active" },
    { ProductID: 4, ProductName: "Rewards Credit Card", ProductCategory: "Credit", InterestRate: 19.99, LaunchDate: "2021-03-10", ProductStatus: "Active" },
    { ProductID: 5, ProductName: "Personal Loan", ProductCategory: "Loan", InterestRate: 8.75, LaunchDate: "2017-09-01", ProductStatus: "Active" },
    { ProductID: 6, ProductName: "Digital Saver", ProductCategory: "Deposit", InterestRate: 4.05, LaunchDate: "2025-02-01", ProductStatus: "Active" },
  ];

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
      CustomerStatus: weightedPick(rng, ["Active", "Inactive", "Closed"], [78, 17, 5]),
      CustomerSegment: weightedPick(rng, segments, province === "Ontario" ? [28, 32, 18, 12, 10] : [34, 23, 14, 16, 13]),
      AcquisitionChannel: weightedPick(rng, acquisitionChannels, province === "British Columbia" ? [24, 30, 12, 22, 12] : [32, 18, 20, 22, 8]),
    });
  }

  const Accounts: Row[] = [];
  let accountId = 7001;
  for (const customer of Customers) {
    const customerSegment = String(customer.CustomerSegment);
    const accountCount = customerSegment === "High Value" ? 2 : rng() > 0.72 ? 2 : 1;
    for (let index = 0; index < accountCount; index += 1) {
      const product = index === 0 ? Products[Math.floor(rng() * 3)] : Products[Math.floor(rng() * Products.length)];
      const activeBias = customer.CustomerStatus === "Active" ? [84, 9, 7] : [25, 38, 37];
      const accountStatus = weightedPick(rng, ["Active", "Inactive", "Closed"], activeBias);
      const highValueMultiplier = customerSegment === "High Value" ? 2.8 : customerSegment === "Dormant" ? 0.35 : 1;
      Accounts.push({
        AccountID: accountId,
        CustomerID: customer.CustomerID,
        ProductID: product.ProductID,
        AccountType: product.ProductCategory === "Credit" ? "Credit Card" : product.ProductName,
        OpenedDate: randomDate(rng, 2018, 2025),
        ClosedDate: accountStatus === "Closed" ? randomDate(rng, 2023, 2026) : null,
        Balance: money((rng() * 8200 + 250) * highValueMultiplier),
        AccountStatus: accountStatus,
      });
      accountId += 1;
    }
  }

  const Applications: Row[] = [];
  const Loans: Row[] = [];
  let loanId = 5001;
  for (let applicationId = 2001; applicationId <= 3500; applicationId += 1) {
    const customer = pick(rng, Customers);
    const branch = pick(rng, Branches);
    const product = pick(rng, Products.filter((candidate) => candidate.ProductCategory === "Loan" || candidate.ProductCategory === "Credit"));
    const status = weightedPick(rng, ["Approved", "Declined", "Pending"], [56, 32, 12]);
    const requestedAmount = money(rng() * 43500 + 1500);
    Applications.push({
      ApplicationID: applicationId,
      CustomerID: customer.CustomerID,
      BranchID: branch.BranchID,
      ProductID: product.ProductID,
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

  const Transactions: Row[] = [];
  const merchantCategories = ["Groceries", "Fuel", "Travel", "Dining", "Payroll", "Utilities", "Transfer", "Subscription"];
  const channels = ["Mobile", "Web", "Branch", "ATM", "Call Centre"];
  for (let transactionId = 15001; transactionId <= 19500; transactionId += 1) {
    const account = pick(rng, Accounts);
    const customer = Customers.find((candidate) => candidate.CustomerID === account.CustomerID);
    const isDigital = customer?.CustomerSegment === "Digital First";
    const amountTrend = transactionId > 18000 ? 0.78 : 1;
    const channel = weightedPick(rng, channels, isDigital ? [56, 27, 4, 8, 5] : [31, 22, 19, 18, 10]);
    Transactions.push({
      TransactionID: transactionId,
      AccountID: account.AccountID,
      TransactionDate: randomDate(rng, 2024, 2026),
      TransactionType: weightedPick(rng, ["Debit", "Credit", "Transfer", "Fee"], [54, 26, 17, 3]),
      Amount: money((rng() * 1750 + 12) * amountTrend),
      MerchantCategory: pick(rng, merchantCategories),
      Channel: channel,
      TransactionStatus: weightedPick(rng, ["Successful", "Failed", "Reversed"], [91, 7, 2]),
    });
  }

  const Campaigns: Row[] = [
    { CampaignID: 1, CampaignName: "Spring Digital Saver Launch", CampaignType: "Product Launch", StartDate: "2025-02-01", EndDate: "2025-03-31", Channel: "Paid Search", CampaignCost: 84000 },
    { CampaignID: 2, CampaignName: "Ontario Everyday Banking Push", CampaignType: "Acquisition", StartDate: "2025-04-01", EndDate: "2025-05-15", Channel: "Organic", CampaignCost: 36000 },
    { CampaignID: 3, CampaignName: "Referral Rewards", CampaignType: "Referral", StartDate: "2025-06-01", EndDate: "2025-07-15", Channel: "Referral", CampaignCost: 42000 },
    { CampaignID: 4, CampaignName: "Branch Welcome Series", CampaignType: "Retention", StartDate: "2025-08-01", EndDate: "2025-09-15", Channel: "Branch", CampaignCost: 28000 },
  ];

  const CustomerEvents: Row[] = [];
  let eventId = 30001;
  for (const customer of Customers.slice(0, 420)) {
    const channel = String(customer.AcquisitionChannel);
    const deviceType = weightedPick(rng, ["Mobile", "Desktop", "Tablet"], channel === "Paid Search" ? [72, 22, 6] : [54, 36, 10]);
    const baseDate = randomDate(rng, 2025, 2025);
    const sessionId = `S-${customer.CustomerID}`;
    const completedProbability = channel === "Paid Search" ? 0.61 : channel === "Referral" ? 0.82 : 0.74;
    const openedProbability = channel === "Paid Search" ? 0.42 : channel === "Referral" ? 0.68 : 0.57;
    CustomerEvents.push({ EventID: eventId, CustomerID: customer.CustomerID, SessionID: sessionId, EventName: "signup_started", EventTimestamp: baseDate, ProductID: null, Channel: channel, DeviceType: deviceType });
    eventId += 1;
    if (rng() < completedProbability) {
      CustomerEvents.push({ EventID: eventId, CustomerID: customer.CustomerID, SessionID: sessionId, EventName: "signup_completed", EventTimestamp: baseDate, ProductID: null, Channel: channel, DeviceType: deviceType });
      eventId += 1;
    }
    if (rng() < openedProbability) {
      CustomerEvents.push({ EventID: eventId, CustomerID: customer.CustomerID, SessionID: sessionId, EventName: "account_opened", EventTimestamp: baseDate, ProductID: pick(rng, Products).ProductID, Channel: channel, DeviceType: deviceType });
      eventId += 1;
    }
    if (rng() < 0.46) {
      CustomerEvents.push({ EventID: eventId, CustomerID: customer.CustomerID, SessionID: sessionId, EventName: "first_transaction", EventTimestamp: baseDate, ProductID: null, Channel: channel, DeviceType: deviceType });
      eventId += 1;
    }
  }

  const MonthlyTargets: Row[] = [];
  for (const branch of Branches) {
    for (let month = 1; month <= 12; month += 1) {
      const monthLabel = `2025-${String(month).padStart(2, "0")}`;
      MonthlyTargets.push({
        Month: monthLabel,
        BranchID: branch.BranchID,
        ApplicationsTarget: 5 + Math.floor(rng() * 9),
        ApprovalsTarget: 3 + Math.floor(rng() * 7),
        RevenueTarget: money(90000 + rng() * 180000),
        CustomerGrowthTarget: 4 + Math.floor(rng() * 12),
      });
    }
  }

  return { Customers, Branches, Applications, Loans, Payments, Products, Accounts, Transactions, Campaigns, CustomerEvents, MonthlyTargets };
}

function validateReadOnlyQuery(query: string) {
  const stripped = query.trim();
  if (!stripped) throw new QueryValidationError("safety_error", "Enter a SQL query before running it.");
  if (stripped.length > MAX_QUERY_LENGTH) throw new QueryValidationError("safety_error", `Query is too long. Keep it under ${MAX_QUERY_LENGTH} characters.`);

  const withoutComments = stripComments(stripped);
  if (hasDoubleQuotedLiteral(withoutComments)) {
    throw new QueryValidationError("dialect_error", "SQLBank uses SQL Server-style SQL. Text values should use single quotes. Try 'Ontario' rather than \"Ontario\".");
  }
  if (hasMultipleStatements(withoutComments)) throw new QueryValidationError("safety_error", "Only one read-only SQL statement can be executed at a time.");
  const firstKeyword = withoutComments.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/)?.[0]?.toUpperCase();
  if (!["SELECT", "WITH"].includes(firstKeyword ?? "")) throw new QueryValidationError("safety_error", "Only SELECT queries and read-only CTE queries are allowed.");

  const tokens = new Set(stripStringLiterals(withoutComments).toUpperCase().match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) ?? []);
  for (const keyword of prohibitedKeywords) {
    if (tokens.has(keyword)) throw new QueryValidationError("safety_error", `Prohibited SQL keyword detected: ${keyword}.`);
  }
  return stripped.replace(/;+\s*$/, "");
}

function normalizeSql(sql: string) {
  return sql.replace(/\bCAST\s*\(([\S\s]*?)\s+AS\s+DECIMAL\s*\(\s*\d+\s*,\s*\d+\s*\)\s*\)/gi, "ROUND($1, 2)");
}

function evaluateQueryResult(
  userResult: NormalizedQueryResult,
  referenceResult: NormalizedQueryResult,
  validation: ExerciseValidation,
): ExerciseEvaluation {
  const userColumns = userResult.columns.map(normalizeIdentifier);
  const referenceColumns = referenceResult.columns.map(normalizeIdentifier);
  const missingColumns = referenceResult.columns.filter((column) => !userColumns.includes(normalizeIdentifier(column)));
  const extraColumns = userResult.columns.filter((column) => !referenceColumns.includes(normalizeIdentifier(column)));

  if (validation.columnPolicy !== "single_value" && missingColumns.length) {
    return {
      correct: false,
      type: validation.aliasPolicy === "required" ? "wrong_alias" : "missing_columns",
      message: `Almost there. Your query ran successfully, but ${formatColumnList(missingColumns)} ${missingColumns.length === 1 ? "is" : "are"} missing from the requested output.`,
      details: { missingColumns },
    };
  }

  if (validation.strictColumns !== false && validation.columnPolicy !== "required_allow_extra" && validation.columnPolicy !== "single_value" && extraColumns.length) {
    return {
      correct: false,
      type: "extra_columns",
      message: `Your query returned the right kind of records, but this task asks for only ${formatPlainColumnList(referenceResult.columns)}.`,
      details: { extraColumns },
    };
  }

  if (validation.columnPolicy === "single_value" || validation.rowPolicy === "single_value") {
    return valuesEqual(userResult.rows[0]?.[0], referenceResult.rows[0]?.[0], validation.numericTolerance)
      ? { correct: true, type: "correct", message: null }
      : { correct: false, type: "aggregation_mismatch", message: "Your query ran, but the calculated value does not match the requested metric yet." };
  }

  const alignedUserRows = alignRowsToReferenceColumns(userResult, referenceResult.columns);
  const rowsMatch = validation.orderPolicy === "required"
    ? compareOrderedRows(alignedUserRows, referenceResult.rows, validation.numericTolerance)
    : compareUnorderedRows(alignedUserRows, referenceResult.rows, validation.numericTolerance);

  if (rowsMatch) return { correct: true, type: "correct", message: null };

  if (validation.orderPolicy === "required" && compareUnorderedRows(alignedUserRows, referenceResult.rows, validation.numericTolerance)) {
    return {
      correct: false,
      type: "wrong_order",
      message: "Your rows are correct, but the requested order is not. Check the ORDER BY requirement for this exercise.",
    };
  }

  if (userResult.rowCount === 0 && referenceResult.rowCount > 0) {
    return {
      correct: false,
      type: "empty_result",
      message: "Your SQL is valid, but it returned no rows. The current task expects matching records, so check the filter value or inspect the values available in the filtered column.",
      details: { actualRowCount: userResult.rowCount, expectedRowCount: referenceResult.rowCount },
    };
  }

  if (userResult.rowCount !== referenceResult.rowCount) {
    return {
      correct: false,
      type: "wrong_row_count",
      message: userResult.rowCount > referenceResult.rowCount
        ? "Your selected columns look right, but the result contains too many rows. Check the filtering, grouping, or TOP requirement."
        : "Your selected columns look right, but the result is missing rows. Check the filtering, grouping, or join condition.",
      details: { actualRowCount: userResult.rowCount, expectedRowCount: referenceResult.rowCount },
    };
  }

  return {
    correct: false,
    type: "wrong_rows",
    message: "Your query ran successfully, but the values do not match the current exercise yet. Check the filters, joins, grouping, and calculations.",
  };
}

export function compareRowsForTest(userRows: unknown[][], referenceRows: unknown[][], mode: Challenge["comparison_mode"], numericTolerance = 0.01) {
  if (mode === "single_value") return valuesEqual(userRows[0]?.[0], referenceRows[0]?.[0], numericTolerance);
  if (mode === "ordered") return compareOrderedRows(userRows, referenceRows, numericTolerance);
  return compareUnorderedRows(userRows, referenceRows, numericTolerance);
}

function compareOrderedRows(userRows: unknown[][], referenceRows: unknown[][], numericTolerance = 0.01) {
  if (userRows.length !== referenceRows.length) return false;
  return referenceRows.every((referenceRow, index) => rowsEqual(userRows[index], referenceRow, numericTolerance));
}

function compareUnorderedRows(userRows: unknown[][], referenceRows: unknown[][], numericTolerance = 0.01) {
  if (userRows.length !== referenceRows.length) return false;
  const used = new Set<number>();
  return referenceRows.every((referenceRow) => {
    const matchIndex = userRows.findIndex((userRow, index) => !used.has(index) && rowsEqual(userRow, referenceRow, numericTolerance));
    if (matchIndex < 0) return false;
    used.add(matchIndex);
    return true;
  });
}

function rowsEqual(userRow: unknown[], referenceRow: unknown[], numericTolerance = 0.01) {
  if (userRow.length !== referenceRow.length) return false;
  return referenceRow.every((referenceValue, index) => valuesEqual(userRow[index], referenceValue, numericTolerance));
}

function valuesEqual(userValue: unknown, referenceValue: unknown, numericTolerance = 0.01) {
  const user = normalizeValue(userValue);
  const reference = normalizeValue(referenceValue);
  if (user === null || reference === null) return user === reference;
  if (typeof user === "number" && typeof reference === "number") return Math.abs(user - reference) <= numericTolerance;
  return user === reference;
}

function getValidationContract(challenge: Challenge): ExerciseValidation {
  if (challenge.validation) return challenge.validation;
  return {
    columnPolicy: challenge.comparison_mode === "single_value" ? "single_value" : referenceUsesSelectStar(challenge.reference_sql) ? "all_source_columns" : "exact",
    rowPolicy: challenge.comparison_mode === "single_value" ? "single_value" : "exact_multiset",
    orderPolicy: challenge.comparison_mode === "ordered" ? "required" : "ignore",
    aliasPolicy: "required",
    numericTolerance: 0.01,
    strictColumns: true,
    requireColumnOrder: false,
  };
}

function referenceUsesSelectStar(sql: string) {
  const columns = resolveSelectStatement(sql)?.columns;
  return Array.isArray(columns) ? columns.some((column: Record<string, unknown>) => column.columnid === "*") : false;
}

function alignRowsToReferenceColumns(userResult: NormalizedQueryResult, referenceColumns: string[]) {
  const indexByColumn = new Map(userResult.columns.map((column, index) => [normalizeIdentifier(column), index]));
  return userResult.rows.map((row) => referenceColumns.map((referenceColumn) => row[indexByColumn.get(normalizeIdentifier(referenceColumn)) ?? -1] ?? null));
}

function resolveResultColumns(sql: string) {
  const resolved = resolveSelectColumns(sql);
  return resolved.length ? resolved : [];
}

function resolveSelectColumns(sql: string, knownSources = new Map<string, ResultColumn[]>(), depth = 0): string[] {
  if (depth > 4) return [];
  const select = resolveSelectStatement(sql);
  if (!select?.columns) return [];

  const sources = buildSourceColumnMap(select, knownSources, depth);
  const output: string[] = [];

  for (const column of select.columns as Record<string, unknown>[]) {
    const columnId = typeof column.columnid === "string" ? column.columnid : null;
    const tableId = typeof column.tableid === "string" ? column.tableid : null;
    if (columnId === "*") {
      const sourceColumns = tableId ? sources.get(normalizeIdentifier(tableId)) ?? [] : Array.from(sources.values()).flat();
      for (const sourceColumn of sourceColumns) output.push(sourceColumn.name);
      continue;
    }
    output.push(resolveOutputColumnName(column));
  }

  return deDuplicateColumns(output);
}

function buildSourceColumnMap(select: Record<string, unknown>, knownSources: Map<string, ResultColumn[]>, depth: number) {
  const sources = new Map<string, ResultColumn[]>(knownSources);
  const withs = Array.isArray(select.withs) ? select.withs : [];
  for (const withDefinition of withs as Record<string, unknown>[]) {
    if (typeof withDefinition.name !== "string" || !withDefinition.select) continue;
    const columns = resolveSelectColumnsFromStatement(withDefinition.select as Record<string, unknown>, sources, depth + 1).map((name) => ({ name, normalizedName: normalizeIdentifier(name), dataType: dataTypeForColumn(name) }));
    sources.set(normalizeIdentifier(withDefinition.name), columns);
  }

  const fromSources = [...(Array.isArray(select.from) ? select.from : []), ...(Array.isArray(select.joins) ? select.joins.map((join: Record<string, unknown>) => ({ ...(join.table as Record<string, unknown>), as: join.as })) : [])] as Record<string, unknown>[];
  for (const source of fromSources) {
    if (typeof source.tableid !== "string") continue;
    const columns = columnsForSource(source.tableid, sources);
    if (!columns.length) continue;
    sources.set(normalizeIdentifier(source.tableid), columns);
    if (typeof source.as === "string") sources.set(normalizeIdentifier(source.as), columns);
  }
  return sources;
}

function resolveSelectColumnsFromStatement(select: Record<string, unknown>, knownSources: Map<string, ResultColumn[]>, depth: number) {
  const wrapperSql = "SELECT 1";
  const sourceColumns = buildSourceColumnMap(select, knownSources, depth);
  const columns = (select.columns as Record<string, unknown>[] | undefined) ?? [];
  if (!columns.length) return resolveSelectColumns(wrapperSql, knownSources, depth);
  const output: string[] = [];
  for (const column of columns) {
    const columnId = typeof column.columnid === "string" ? column.columnid : null;
    const tableId = typeof column.tableid === "string" ? column.tableid : null;
    if (columnId === "*") {
      const expanded = tableId ? sourceColumns.get(normalizeIdentifier(tableId)) ?? [] : Array.from(sourceColumns.values()).flat();
      expanded.forEach((item) => output.push(item.name));
    } else {
      output.push(resolveOutputColumnName(column));
    }
  }
  return deDuplicateColumns(output);
}

function columnsForSource(sourceName: string, knownSources: Map<string, ResultColumn[]>) {
  const known = knownSources.get(normalizeIdentifier(sourceName));
  if (known) return known;
  const table = schema.find((candidate) => normalizeIdentifier(candidate.table) === normalizeIdentifier(sourceName));
  return table?.columns.map((column) => ({ name: column.name, normalizedName: normalizeIdentifier(column.name), dataType: column.type })) ?? [];
}

function resolveSelectStatement(sql: string): Record<string, unknown> | null {
  try {
    const parsed = (alasql as unknown as { parse: (query: string) => { statements?: Record<string, unknown>[] } }).parse(normalizeSql(sql));
    const statement = parsed.statements?.[0];
    if (!statement) return null;
    return (statement.select as Record<string, unknown> | undefined) ?? statement;
  } catch {
    return null;
  }
}

function resolveOutputColumnName(column: Record<string, unknown>) {
  if (typeof column.as === "string") return column.as;
  if (typeof column.columnid === "string") return column.columnid;
  if (typeof column.aggregatorid === "string") return `${column.aggregatorid.toUpperCase()}(...)`;
  if (typeof column.funcid === "string") return column.funcid.toUpperCase();
  return "Expression";
}

function deDuplicateColumns(columns: string[]) {
  const seen = new Map<string, number>();
  return columns.map((column) => {
    const normalized = normalizeIdentifier(column);
    const count = seen.get(normalized) ?? 0;
    seen.set(normalized, count + 1);
    return count === 0 ? column : `${column}_${count + 1}`;
  });
}

function dataTypeForColumn(columnName: string) {
  const normalized = normalizeIdentifier(columnName);
  for (const table of schema) {
    const column = table.columns.find((candidate) => normalizeIdentifier(candidate.name) === normalized);
    if (column) return column.type;
  }
  return undefined;
}

function normalizeIdentifier(value: string) {
  return value.replace(/[\[\]"`]/g, "").trim().toLowerCase();
}

function formatColumnList(columns: string[]) {
  return columns.map((column) => `\`${column}\``).join(columns.length === 2 ? " and " : ", ");
}

function formatPlainColumnList(columns: string[]) {
  if (columns.length <= 1) return columns.join("");
  if (columns.length === 2) return `${columns[0]} and ${columns[1]}`;
  return `${columns.slice(0, -1).join(", ")}, and ${columns[columns.length - 1]}`;
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

function hasDoubleQuotedLiteral(sql: string) {
  return /"[^"]*"/.test(sql);
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
