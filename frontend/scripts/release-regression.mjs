import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

const modules = createModuleLoader();
const course = modules.requireTs("lib/course.ts");
const access = modules.requireTs("lib/course-access.ts");
const progress = modules.requireTs("lib/progress.ts");
const sqlbank = modules.requireTs("lib/sqlbank-server.ts");

const tests = [
  {
    name: "Beginner users can execute representative questions from Q1 through Q100",
    run() {
      const beginner = course.allSqlCourses().find((item) => item.learningModeId === "completely-new");
      const beginnerIds = access.beginnerChallengeIds(beginner);
      assert(beginnerIds.length === 100, `expected 100 Beginner challenge ids, got ${beginnerIds.length}`);
      for (const challengeId of [1, 4, 5, 25, 50, 100]) {
        const decision = access.canAccessLearningChallenge({ selected_role: null, sql_level: "completely-new" }, [], challengeId);
        assert(decision.allowed, `challenge ${challengeId} should be allowed`);
      }
    },
  },
  {
    name: "invalid challenge id is still rejected",
    run() {
      const decision = access.canAccessLearningChallenge({ selected_role: null, sql_level: "completely-new" }, [], 9999);
      assert(!decision.allowed, "invalid challenge should be rejected");
      assert(decision.code === "COURSE_UNAVAILABLE", `expected COURSE_UNAVAILABLE, got ${decision.code}`);
    },
  },
  {
    name: "attempt insert includes query text and execution time",
    run() {
      const attemptedAt = "2026-09-03T12:00:00.000Z";
      const payload = progress.buildChallengeAttemptInsert("user-1", 1, "SELECT * FROM Customers;", { correct: true, executionTimeMs: 12.6 }, attemptedAt);
      assert(payload.user_id === "user-1", "user id should be stored");
      assert(payload.challenge_id === 1, "challenge id should be stored");
      assert(payload.query_text === "SELECT * FROM Customers;", "query text should be stored");
      assert(payload.is_correct === true, "correctness should be stored");
      assert(payload.execution_time_ms === 13, `execution time should be rounded, got ${payload.execution_time_ms}`);
      assert(payload.attempted_at === attemptedAt, "attempt timestamp should be stored");
    },
  },
  {
    name: "rerunning an already completed challenge does not revert completion",
    run() {
      const existing = {
        user_id: "user-1",
        challenge_id: 1,
        status: "completed",
        attempt_count: 2,
        first_started_at: "2026-09-01T12:00:00.000Z",
        completed_at: "2026-09-01T12:03:00.000Z",
        updated_at: "2026-09-01T12:03:00.000Z",
      };
      const update = progress.nextProgressUpdateForAttempt("user-1", 1, existing, { correct: false, executionTimeMs: 10 }, "2026-09-03T12:00:00.000Z");
      assert(update.status === "completed", "completed challenge should remain completed");
      assert(update.completed_at === existing.completed_at, "completion timestamp should be preserved");
      assert(update.attempt_count === 3, "attempt count should increment");
    },
  },
  {
    name: "read-only SELECT and WITH queries execute",
    run() {
      assert(sqlbank.runFreeSqlBankQuery("SELECT TOP 1 CustomerID FROM Customers;").body.success, "SELECT should execute");
      assert(sqlbank.runFreeSqlBankQuery("WITH sample AS (SELECT TOP 1 CustomerID FROM Customers) SELECT * FROM sample;").body.success, "WITH should execute");
    },
  },
  {
    name: "destructive and multi-statement SQL is rejected",
    run() {
      for (const keyword of ["DELETE", "DROP", "UPDATE", "INSERT", "ALTER"]) {
        const result = sqlbank.runFreeSqlBankQuery(`${keyword} Customers`).body;
        assert(!result.success && result.errorType === "safety_error", `${keyword} should be rejected`);
      }
      const multi = sqlbank.runFreeSqlBankQuery("SELECT * FROM Customers; DROP TABLE Customers;").body;
      assert(!multi.success && multi.errorType === "safety_error", "multi-statement bypass should be rejected");
    },
  },
];

for (const test of tests) {
  test.run();
  console.log(`PASS ${test.name}`);
}

console.log(`\n${tests.length} release regression checks passed.`);

function createModuleLoader() {
  const require = createRequire(import.meta.url);
  const ts = require("typescript");
  const cache = new Map();

  function requireTs(relativePath) {
    const sourcePath = resolve(relativePath);
    if (cache.has(sourcePath)) return cache.get(sourcePath).exports;

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
    cache.set(sourcePath, module);
    const localRequire = (specifier) => {
      if (specifier.startsWith("@/")) return requireTs(`${specifier.slice(2)}.ts`);
      if (specifier.startsWith(".")) return requireTs(resolve(dirname(sourcePath), `${specifier}.ts`));
      if (specifier === "@supabase/supabase-js") return {};
      return require(specifier);
    };

    const context = {
      console,
      exports: module.exports,
      module,
      process,
      require: localRequire,
      performance,
      setTimeout,
      clearTimeout,
    };
    vm.runInNewContext(output, context, { filename: sourcePath });
    return module.exports;
  }

  return { requireTs };
}

function assert(value, message) {
  if (!value) throw new Error(message);
}


