import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const sqlbank = loadSqlBankServer();
const publicChallenges = sqlbank.listChallenges();
const audit = sqlbank.auditSqlBankCurriculum();
const failures = [];

for (const item of audit) {
  const publicChallenge = publicChallenges.find((challenge) => challenge.id === item.id);
  if (!publicChallenge) {
    failures.push(`Challenge ${item.id}: missing public challenge metadata`);
    continue;
  }
  if (!item.referencePasses) failures.push(`Challenge ${item.id}: reference SQL does not self-evaluate as correct`);
  if (!item.columns.length) failures.push(`Challenge ${item.id}: reference result has no columns`);
  if (item.rowCount <= 0) failures.push(`Challenge ${item.id}: reference result is empty; mark this intentional before allowing zero-row exercises`);
  if (!publicChallenge.title?.trim()) failures.push(`Challenge ${item.id}: title is missing`);
  if (!publicChallenge.description?.trim()) failures.push(`Challenge ${item.id}: description is missing`);
  if (!publicChallenge.concept?.trim()) failures.push(`Challenge ${item.id}: concept explanation is missing`);
  if (!Array.isArray(publicChallenge.success_criteria) || publicChallenge.success_criteria.length === 0) failures.push(`Challenge ${item.id}: success criteria are missing`);
  if (!publicChallenge.guidance || Object.keys(publicChallenge.guidance).length < 4) failures.push(`Challenge ${item.id}: level-specific guidance is incomplete`);
}

if (failures.length) {
  console.error("Curriculum validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Curriculum validation passed for ${audit.length} SQLBank challenges.`);
for (const item of audit) {
  console.log(`Challenge ${item.id}: reference executes, ${item.columns.length} columns, ${item.rowCount} rows, ${item.validation.orderPolicy} order`);
}

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
