import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const sqlbank = loadSqlBankServer();

const customersColumns = [
  "CustomerID",
  "FirstName",
  "LastName",
  "Province",
  "City",
  "DateOfBirth",
  "CustomerSince",
  "CustomerStatus",
  "CustomerSegment",
  "AcquisitionChannel",
];

const cases = [
  {
    name: "Challenge 3 accepts SELECT star Ontario filter",
    run() {
      const result = sqlbank.runSqlBankQuery(3, "SELECT * FROM Customers WHERE Province = 'Ontario';").body;
      assert(result.success, "query should execute");
      assert(result.correct, "Ontario SELECT * should pass challenge 3");
      assert(result.rowCount > 0, "Ontario filter should return rows");
      assertSameColumns(result.columns, customersColumns);
    },
  },
  {
    name: "Challenge 3 accepts lowercase and whitespace variants",
    run() {
      for (const query of [
        "select * from Customers where Province = 'Ontario'",
        "SELECT    *\nFROM      Customers\nWHERE     Province='Ontario'\n;",
      ]) {
        const result = sqlbank.runSqlBankQuery(3, query).body;
        assert(result.success && result.correct, `${query} should pass`);
      }
    },
  },
  {
    name: "Zero-row explicit projection preserves columns",
    run() {
      const result = sqlbank.runFreeSqlBankQuery("SELECT CustomerID, FirstName, Province FROM Customers WHERE Province = 'Atlantis';").body;
      assert(result.success, "query should execute");
      assert(result.rowCount === 0, "query should return zero rows");
      assertSameColumns(result.columns, ["CustomerID", "FirstName", "Province"]);
    },
  },
  {
    name: "Zero-row SELECT star preserves source schema",
    run() {
      const result = sqlbank.runFreeSqlBankQuery("SELECT * FROM Customers WHERE Province = 'Atlantis';").body;
      assert(result.success, "query should execute");
      assert(result.rowCount === 0, "query should return zero rows");
      assertSameColumns(result.columns, customersColumns);
    },
  },
  {
    name: "Wrong Ontario filter reports empty result, not missing columns",
    run() {
      const result = sqlbank.runSqlBankQuery(3, "SELECT * FROM Customers WHERE Province = 'Atlantis';").body;
      assert(result.success, "query should execute");
      assert(!result.correct, "wrong filter should not pass");
      assert(result.evaluation?.type === "empty_result", `expected empty_result, got ${result.evaluation?.type}`);
      assert(!/missing/i.test(result.message ?? ""), "feedback should not say columns are missing");
      assertSameColumns(result.columns, customersColumns);
    },
  },
  {
    name: "Double quoted text literal returns dialect hint",
    run() {
      const result = sqlbank.runSqlBankQuery(3, 'SELECT * FROM Customers WHERE Province = "Ontario";').body;
      assert(!result.success, "double-quoted literal should be rejected before exercise evaluation");
      assert(result.errorType === "dialect_error", `expected dialect_error, got ${result.errorType}`);
      assert(/single quotes/i.test(result.message ?? ""), "message should teach single quotes");
    },
  },
  {
    name: "Strict stage columns pass and reject extras",
    run() {
      const correct = sqlbank.runSqlBankQuery(2, "SELECT CustomerID, FirstName, LastName, Province, City FROM Customers;").body;
      assert(correct.success && correct.correct, "challenge 2 strict projection should pass");

      const extra = sqlbank.runSqlBankQuery(2, "SELECT * FROM Customers;").body;
      assert(extra.success && !extra.correct, "SELECT * should fail strict five-column challenge");
      assert(extra.evaluation?.type === "extra_columns", `expected extra_columns, got ${extra.evaluation?.type}`);
    },
  },
  {
    name: "Business contact extract is evaluated against its own stage",
    run() {
      const result = sqlbank.runSqlBankQuery(2, "SELECT CustomerID, FirstName, LastName, Province, City FROM Customers;").body;
      assert(result.success && result.correct, "challenge 2 should pass its five-column extract");
    },
  },
  {
    name: "Explicit all Customers columns passes full-table task",
    run() {
      const result = sqlbank.runSqlBankQuery(1, `SELECT ${customersColumns.join(", ")} FROM Customers;`).body;
      assert(result.success && result.correct, "explicit full customer column list should match SELECT * task");
    },
  },
  {
    name: "Ordered challenge detects wrong order",
    run() {
      const result = sqlbank.runSqlBankQuery(20, "SELECT * FROM Loans ORDER BY LoanAmount ASC;").body;
      assert(result.success && !result.correct, "ascending order should fail descending order task");
      assert(result.evaluation?.type === "wrong_order", `expected wrong_order, got ${result.evaluation?.type}`);
    },
  },
  {
    name: "Unordered row comparison is duplicate-aware",
    run() {
      assert(sqlbank.compareRowsForTest([["A"], ["A"], ["B"]], [["B"], ["A"], ["A"]], "unordered"), "same duplicate multiset should pass");
      assert(!sqlbank.compareRowsForTest([["A"], ["B"]], [["A"], ["A"], ["B"]], "unordered"), "missing duplicate should fail");
    },
  },
  {
    name: "Numeric tolerance works for decimal aggregates",
    run() {
      assert(sqlbank.compareRowsForTest([[72.129]], [[72.13]], "single_value", 0.01), "near decimals should match");
      assert(!sqlbank.compareRowsForTest([[72.1]], [[72.13]], "single_value", 0.001), "outside tolerance should fail");
    },
  },
  {
    name: "NULL values are preserved and comparable",
    run() {
      const result = sqlbank.runFreeSqlBankQuery("SELECT AccountID, ClosedDate FROM Accounts WHERE ClosedDate IS NULL;").body;
      assert(result.success, "NULL query should execute");
      assert(result.rows.length > 0, "seed data should include open accounts");
      assert(result.rows.every((row) => row[1] === null), "ClosedDate should be returned as null");
      assert(sqlbank.compareRowsForTest([[null]], [[null]], "single_value"), "null should equal null");
    },
  },
  {
    name: "Truncated display keeps total row count",
    run() {
      const result = sqlbank.runSqlBankQuery(1, "SELECT * FROM Customers;").body;
      assert(result.success && result.correct, "full customer query should pass");
      assert(result.rowCount === 500, `expected total rowCount 500, got ${result.rowCount}`);
      assert(result.rows.length === 200, `expected displayed rows 200, got ${result.rows.length}`);
      assert(result.displayedRowCount === 200, `expected displayedRowCount 200, got ${result.displayedRowCount}`);
      assert(result.truncated, "result should be marked truncated");
    },
  },
];

for (const testCase of cases) {
  testCase.run();
  console.log(`PASS ${testCase.name}`);
}

console.log(`\n${cases.length} SQLBank regression checks passed.`);

function loadSqlBankServer() {
  const require = createRequire(import.meta.url);
  const ts = require("typescript");
  const sourcePath = resolve("lib/sqlbank-server.ts");
  const source = readFileSync(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: sourcePath,
  }).outputText;

  const module = { exports: {} };
  const context = {
    console,
    exports: module.exports,
    module,
    process,
    require,
    performance,
    setTimeout,
    clearTimeout,
  };
  vm.runInNewContext(output, context, { filename: sourcePath });
  return module.exports;
}

function assert(value, message) {
  if (!value) throw new Error(message);
}

function assertSameColumns(actual, expected) {
  assert(Array.isArray(actual), "columns should be an array");
  assert(actual.length === expected.length, `expected columns ${expected.join(", ")}, got ${actual.join(", ")}`);
  for (let index = 0; index < expected.length; index += 1) {
    assert(actual[index] === expected[index], `expected column ${expected[index]} at index ${index}, got ${actual[index]}`);
  }
}
