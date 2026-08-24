import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

const sqlbank = loadSqlBankServer();
const course = loadCourseModule();
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

validateCurriculumNavigation();

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
  return loadTsModule("lib/sqlbank-server.ts");
}

function loadCourseModule() {
  return loadTsModule("lib/course.ts");
}

function loadTsModule(sourcePathValue) {
  const rootRequire = createRequire(import.meta.url);
  const ts = rootRequire("typescript");
  const sourcePath = resolve(sourcePathValue);
  const sourceRequire = createRequire(sourcePath);
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
  const require = (specifier) => {
    if (specifier.startsWith("./") || specifier.startsWith("../")) {
      const resolved = resolve(dirname(sourcePath), specifier);
      if (existsSync(`${resolved}.ts`)) return loadTsModule(`${resolved}.ts`);
      if (existsSync(resolved)) return sourceRequire(resolved);
    }
    if (specifier.startsWith("@/")) {
      const resolved = resolve(specifier.slice(2));
      if (existsSync(`${resolved}.ts`)) return loadTsModule(`${resolved}.ts`);
    }
    return sourceRequire(specifier);
  };
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

function validateCurriculumNavigation() {
  const courses = course.allSqlCourses();
  for (const courseDefinition of courses) {
    for (let moduleIndex = 0; moduleIndex < courseDefinition.modules.length; moduleIndex += 1) {
      const module = courseDefinition.modules[moduleIndex];
      for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex += 1) {
        const lesson = module.lessons[lessonIndex];
        const stages = course.getLessonStages(lesson);
        if (!stages.length) {
          failures.push(`${courseDefinition.id}/${lesson.id}: lesson has no questions`);
          continue;
        }

        for (let questionIndex = 0; questionIndex < stages.length; questionIndex += 1) {
          const position = course.resolveCurriculumPosition(courseDefinition, lesson.id, questionIndex);
          if (!position) {
            failures.push(`${courseDefinition.id}/${lesson.id}: resolver returned null for question ${questionIndex + 1}`);
            continue;
          }

          if (position.questionCount !== stages.length) failures.push(`${courseDefinition.id}/${lesson.id}: question count mismatch`);
          if (position.hasPreviousQuestion !== questionIndex > 0) failures.push(`${courseDefinition.id}/${lesson.id}: previous question flag mismatch at question ${questionIndex + 1}`);
          if (position.hasNextQuestion !== questionIndex < stages.length - 1) failures.push(`${courseDefinition.id}/${lesson.id}: next question flag mismatch at question ${questionIndex + 1}`);

          const finalQuestion = questionIndex === stages.length - 1;
          const finalLessonInModule = lessonIndex === module.lessons.length - 1;
          const finalModuleInCourse = moduleIndex === courseDefinition.modules.length - 1;

          if (finalQuestion && !finalLessonInModule && !position.hasNextLesson) failures.push(`${courseDefinition.id}/${lesson.id}: final question should lead to next lesson`);
          if (finalQuestion && finalLessonInModule && !finalModuleInCourse && !position.hasNextModule) failures.push(`${courseDefinition.id}/${lesson.id}: final module lesson should lead to next module`);
          if (finalQuestion && finalLessonInModule && finalModuleInCourse && !position.isFinalCourseQuestion) failures.push(`${courseDefinition.id}/${lesson.id}: final course question was not detected`);
          if (!finalQuestion && (position.hasNextLesson || position.hasNextModule || position.isFinalCourseQuestion)) failures.push(`${courseDefinition.id}/${lesson.id}: non-final question crossed a curriculum boundary`);
        }
      }
    }
  }

  const firstCourse = course.allSqlCourses().find((candidate) => candidate.learningModeId === "completely-new") ?? course.allSqlCourses()[0];
  const firstLesson = firstCourse?.modules[0]?.lessons[0];
  const firstPosition = firstCourse && firstLesson ? course.resolveCurriculumPosition(firstCourse, firstLesson.id, 0) : null;
  if (!firstPosition?.hasNextLesson || firstPosition.hasNextModule || firstPosition.isFinalCourseQuestion) {
    failures.push("first completely-new lesson should resolve to Next Lesson, not Next Module or Complete Course");
  }
}
