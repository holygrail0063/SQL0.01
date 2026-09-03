#!/usr/bin/env node

import { readFileSync } from "node:fs";

const files = {
  appShell: read("components/AppShell.tsx"),
  guidedTour: read("components/tour/GuidedTour.tsx"),
  help: read("app/account/help/page.tsx"),
  lessonWorkspace: read("components/LessonWorkspace.tsx"),
  sqlEditor: read("components/SqlEditor.tsx"),
  conceptLessons: read("lib/sql-concept-lessons.ts"),
  editorState: read("lib/sql-editor-state.ts"),
  tours: read("lib/tours.ts"),
};

const checks = [];

check("Lesson Coach UI and state are removed", () => {
  absent(files.lessonWorkspace, "Lesson Coach");
  absent(files.lessonWorkspace, "showTutor");
  absent(files.lessonWorkspace, "showLessonCoach");
  absent(files.lessonWorkspace, "lessonTutorKey");
  absent(files.editorState, "lessonTutorKey");
  absent(files.conceptLessons, "coachPrompt:");
});

check("Replay Lesson is available without mutating editor/progress state", () => {
  contains(files.lessonWorkspace, 'data-tour="replay-lesson"');
  contains(files.lessonWorkspace, "RefreshCcw");
  contains(files.lessonWorkspace, "function replayLesson()");
  contains(files.lessonWorkspace, "setReviewConceptId(primaryReplayConcept.id)");
  absent(sliceFunction(files.lessonWorkspace, "function replayLesson()"), "setQuery(");
  absent(sliceFunction(files.lessonWorkspace, "function replayLesson()"), "recordAttempt");
  absent(sliceFunction(files.lessonWorkspace, "function replayLesson()"), "setProgress(");
});

check("Automatic concept lessons use persisted completion and manual replay still opens", () => {
  contains(files.lessonWorkspace, "completedConceptStages.has(concept.id)");
  contains(files.lessonWorkspace, "conceptStorageKey(user.id, course.id)");
  contains(files.lessonWorkspace, "reviewConceptLesson");
  contains(files.lessonWorkspace, "replay />");
});

check("App tour and workspace tour are versioned per authenticated user", () => {
  contains(files.tours, 'APP_TOUR_ID: TourId = "queryright_app_tour_v1"');
  contains(files.tours, 'WORKSPACE_TOUR_ID: TourId = "queryright_workspace_tour_v1"');
  contains(files.tours, "queryright:tour:${userId}:${tourId}:completed");
  contains(files.tours, "queryright:tour:${userId}:pending");
  contains(files.appShell, "profile?.onboarding_completed");
});
check("App tour has exactly four visible steps and no removed nav targets", () => {
  contains(files.tours, 'id: "learn"');
  contains(files.tours, 'id: "sql-space"');
  contains(files.tours, 'id: "profile"');
  contains(files.tours, 'id: "tour-replay"');
  absent(files.tours, 'id: "dashboard"');
  absent(files.tours, 'id: "sqlbank"');
  absent(files.tours, "nav-dashboard");
  absent(files.tours, "nav-sqlbank");
  absent(files.appShell, "Dashboard");
  absent(files.appShell, "SQLBank");
  const appTourBlock = files.tours.slice(files.tours.indexOf("export const appTourSteps"), files.tours.indexOf("export const workspaceTourSteps"));
  const stepCount = (appTourBlock.match(/\n  \{/g) ?? []).length;
  if (stepCount !== 4) throw new Error(`Expected 4 app tour steps, found ${stepCount}`);
});

check("Guided tour has spotlight behaviour and resilient controls", () => {
  contains(files.appShell + files.lessonWorkspace + files.tours, "queryright:start-tour");
  contains(files.guidedTour, "scrollIntoView");
  contains(files.guidedTour, 'window.addEventListener("resize"');
  contains(files.guidedTour, 'window.addEventListener("scroll"');
  contains(files.guidedTour, "ResizeObserver");
  contains(files.guidedTour, "getBoundingClientRect()");
  contains(files.guidedTour, 'frame.shape === "circle"');
  contains(files.guidedTour, "radial-gradient(circle");
  contains(files.guidedTour, "pointer-events-auto");
  contains(files.guidedTour, "missingAttempts");
  contains(files.guidedTour, "console.warn");
  contains(files.guidedTour, 'event.key === "Escape"');
  contains(files.guidedTour, "Back");
  contains(files.guidedTour, "Skip");
  absent(files.guidedTour, "% steps.length");
});

check("Stable tour targets exist for requested app and workspace steps", () => {
  for (const target of [
    'data-tour={item.tour}',
    'data-tour="profile-menu"',
    'data-tour="app-tour-replay"',
    'data-tour="workspace-question"',
    'data-tour="schema-explorer"',
    'dataTour="sql-editor"',
    'data-tour="run-query"',
    'data-tour="result-tabs"',
    'data-tour="hint-control"',
    'data-tour="next-navigation"',
  ]) {
    contains(Object.values(files).join("\n"), target);
  }
});

check("Workspace tour waits for concept overlays and uses tight targets", () => {
  contains(files.lessonWorkspace, "workspaceTourPending");
  contains(files.lessonWorkspace, "conceptOverlayOpen || workspaceTourActive");
  contains(files.lessonWorkspace, "active={workspaceTourActive && !conceptOverlayOpen}");
  contains(files.lessonWorkspace, "if (!primaryReplayConcept || workspaceTourActive) return");
  contains(files.lessonWorkspace, 'data-tour="workspace-question"');
  contains(files.lessonWorkspace, 'data-tour="schema-explorer"');
  contains(files.lessonWorkspace, 'dataTour="sql-editor"');
  contains(files.lessonWorkspace, 'data-tour="run-query"');
  contains(files.lessonWorkspace, 'data-tour="result-tabs"');
  contains(files.lessonWorkspace, 'data-tour="hint-control"');
  contains(files.lessonWorkspace, 'data-tour="replay-lesson"');
  contains(files.lessonWorkspace, 'data-tour="next-navigation"');
  absent(files.tours, "lesson-navigation");
});
check("Manual tour replay entries exist in Help", () => {
  contains(files.help, "Take QueryRight Tour");
  contains(files.help, "Replay Workspace Tour");
  contains(files.help, "requestTour(user.id, APP_TOUR_ID)");
  contains(files.help, "requestTour(user.id, WORKSPACE_TOUR_ID)");
});

for (const item of checks) console.log(`${item.status} ${item.name}`);
const failures = checks.filter((item) => item.status === "FAIL");
if (failures.length) {
  console.error(`\n${failures.length} tour/replay regression check(s) failed.`);
  process.exit(1);
}
console.log(`\n${checks.length} tour/replay regression checks passed.`);

function check(name, fn) {
  try {
    fn();
    checks.push({ name, status: "PASS" });
  } catch (error) {
    checks.push({ name, status: "FAIL" });
    console.error(`FAIL ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function read(path) {
  return readFileSync(path, "utf8");
}

function contains(text, needle) {
  if (!text.includes(needle)) throw new Error(`Missing ${needle}`);
}

function absent(text, needle) {
  if (text.includes(needle)) throw new Error(`Unexpected ${needle}`);
}

function sliceFunction(text, signature) {
  const start = text.indexOf(signature);
  if (start < 0) return "";
  const next = text.indexOf("\n  function ", start + signature.length);
  return text.slice(start, next > start ? next : undefined);
}