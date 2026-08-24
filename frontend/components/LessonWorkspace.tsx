"use client";

import Link from "next/link";
import { BookOpen, Lightbulb, PanelLeftClose, PanelLeftOpen, Play, RotateCcw } from "lucide-react";
import type { CSSProperties, Dispatch, PointerEvent, ReactNode, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { ResultsTable } from "@/components/ResultsTable";
import { SchemaExplorer } from "@/components/SchemaExplorer";
import { SqlEditor } from "@/components/SqlEditor";
import { api, type Challenge, type QueryResult, type SchemaTable } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getLessonById, getLessonStages, type LessonStageDefinition } from "@/lib/course";
import { getProgress, recordAttempt, type ProgressRow } from "@/lib/progress";
import { lastSqlWorkspaceKey, lessonDraftKey } from "@/lib/sql-editor-state";

export function LessonWorkspace({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const lessonBundle = useMemo(() => getLessonById(lessonId), [lessonId]);
  const stages = useMemo(() => (lessonBundle ? getLessonStages(lessonBundle.lesson) : []), [lessonBundle]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [hintCount, setHintCount] = useState(0);
  const [showTutor, setShowTutor] = useState(false);
  const [completedConceptStages, setCompletedConceptStages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"task" | "database">("task");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [editorPercent, setEditorPercent] = useState(52);
  const [resultTab, setResultTab] = useState<"results" | "feedback" | "breakdown">("results");

  useEffect(() => {
    if (!user) return;
    Promise.all([api.challenges(), api.schema(), getProgress(user)])
      .then(([challengeData, schemaData, progressData]) => {
        setChallenges(challengeData);
        setSchema(schemaData);
        setProgress(progressData);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Lesson data could not be loaded."))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!lessonBundle || !user) return;
    window.localStorage.setItem(lastSqlWorkspaceKey(user.id), `/learn/lesson/${lessonId}`);
    const saved = window.localStorage.getItem(storageKey(user.id, lessonId));
    const savedConcepts = JSON.parse(window.localStorage.getItem(conceptStorageKey(user.id)) ?? "[]") as string[];
    setCompletedConceptStages(new Set(savedConcepts));
    const savedIndex = saved ? Number(saved) : Number.NaN;
    if (Number.isInteger(savedIndex) && savedIndex >= 0 && savedIndex < stages.length) {
      setActiveStageIndex(savedIndex);
      return;
    }
    const nextIndex = stages.findIndex((stage) => !isStageCompleted(stage, progress, new Set(savedConcepts)));
    setActiveStageIndex(nextIndex >= 0 ? nextIndex : Math.max(0, stages.length - 1));
  }, [lessonBundle, lessonId, progress, stages, user]);

  useEffect(() => {
    const activeStage = stages[activeStageIndex];
    setResult(null);
    setHintCount(0);
    setShowTutor(false);
    setProgressMessage(null);
    setResultTab("results");
    if (activeStage && !activeStage.carryForwardQuery) {
      const draft = user ? window.localStorage.getItem(lessonDraftKey(user.id, lessonId, activeStage.id)) : null;
      setQuery(draft ?? activeStage.starterSql ?? "");
    }
  }, [activeStageIndex, lessonId, stages, user]);

  useEffect(() => {
    const activeStage = stages[activeStageIndex];
    if (!user || !activeStage || !activeStage.challengeId || result?.correct) return;
    window.localStorage.setItem(lessonDraftKey(user.id, lessonId, activeStage.id), query);
  }, [activeStageIndex, lessonId, query, result?.correct, stages, user]);

  useEffect(() => {
    if (!user) return;
    const savedEditor = Number(window.localStorage.getItem(workspaceSplitKey(user.id)));
    const savedSidebar = Number(window.localStorage.getItem(sidebarWidthKey(user.id)));
    if (Number.isFinite(savedEditor)) setEditorPercent(clamp(savedEditor, 36, 68));
    if (Number.isFinite(savedSidebar)) setSidebarWidth(clamp(savedSidebar, 260, 450));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    window.localStorage.setItem(workspaceSplitKey(user.id), String(editorPercent));
  }, [editorPercent, user]);

  useEffect(() => {
    if (!user) return;
    window.localStorage.setItem(sidebarWidthKey(user.id), String(sidebarWidth));
  }, [sidebarWidth, user]);

  if (loading) return <main className="p-8 text-slate-400">Preparing your lesson...</main>;
  if (!lessonBundle) return <main className="p-8 text-red-200">This lesson was not found.</main>;

  const { course, module, lesson } = lessonBundle;
  const activeStage = stages[activeStageIndex] ?? stages[0];
  const activeChallenge = activeStage?.challengeId ? challenges.find((challenge) => challenge.id === activeStage.challengeId) ?? null : null;
  const visibleHints = activeStage?.hints.slice(0, hintCount) ?? [];
  const canRevealMoreHints = Boolean(activeStage && hintCount < activeStage.hints.length);
  const allStagesCompleted = stages.every((stage) => isStageCompleted(stage, progress, completedConceptStages) || (stage.id === activeStage?.id && result?.correct));

  async function runQuery() {
    if (!activeChallenge || !activeStage) return;
    setRunning(true);
    setError(null);
    setProgressMessage(null);
    try {
      const queryResult = await api.runQuery(activeChallenge.id, query);
      setResult(queryResult);
      setResultTab("results");
      if (editorPercent > 64) setEditorPercent(56);
      if (user) {
        await recordAttempt(user, activeChallenge.id, query, queryResult);
        const progressData = await getProgress(user);
        setProgress(progressData);
        if (queryResult.correct) setProgressMessage(`${activeStage.title} complete.`);
      }
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "The query request failed.");
    } finally {
      setRunning(false);
    }
  }

  function continueToNextStage() {
    if (!activeStage || !user) return;
    if (!activeStage.challengeId) {
      const nextConcepts = new Set(completedConceptStages);
      nextConcepts.add(activeStage.id);
      setCompletedConceptStages(nextConcepts);
      window.localStorage.setItem(conceptStorageKey(user.id), JSON.stringify([...nextConcepts]));
    }
    const nextIndex = Math.min(activeStageIndex + 1, stages.length - 1);
    window.localStorage.setItem(storageKey(user.id, lessonId), String(nextIndex));
    setActiveStageIndex(nextIndex);
  }

  function moveToStage(index: number) {
    if (!user) return;
    const stage = stages[index];
    if (!stage) return;
    const previousStagesComplete = stages.slice(0, index).every((candidate) => isStageCompleted(candidate, progress, completedConceptStages));
    if (!previousStagesComplete) return;
    window.localStorage.setItem(storageKey(user.id, lessonId), String(index));
    setActiveStageIndex(index);
  }

  const canContinue = Boolean(activeStage && (!activeStage.challengeId || result?.correct));
  const editorHeight = `${editorPercent}%`;
  const resultsHeight = `${100 - editorPercent}%`;
  const hasMultipleStages = stages.length > 1;

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-ink text-slate-50 lg:flex lg:h-[calc(100dvh-4rem)] lg:min-h-[560px] lg:flex-col lg:overflow-hidden">
      <header className="shrink-0 border-b border-line bg-panel px-5 py-3">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs uppercase tracking-wider text-cyan">{course.learningGoal} Path / Module {module.sequence} / Lesson {lesson.sequence}</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-50">{lesson.title}</h1>
              <p className="mt-1 text-sm text-slate-400">{lesson.difficulty} • {lesson.estimatedMinutes} min • {lesson.skills.join(", ")}</p>
            </div>
            <Link className="rounded border border-line px-4 py-2 text-sm font-semibold text-slate-300 hover:border-brand-strong/50" href="/learn">Back to Course</Link>
          </div>
          {hasMultipleStages && (
            <div className="mt-3 flex flex-wrap gap-2">
              {stages.map((stage, index) => {
                const completed = isStageCompleted(stage, progress, completedConceptStages) || (stage.id === activeStage?.id && Boolean(result?.correct));
                const current = index === activeStageIndex;
                const previousStagesComplete = stages.slice(0, index).every((candidate) => isStageCompleted(candidate, progress, completedConceptStages));
                return (
                  <button
                    className={`rounded-full border px-3 py-1 text-xs ${current ? "border-brand/40 bg-brand/15 text-brand" : completed ? "border-line text-success" : "border-line text-slate-500"}`}
                    disabled={!previousStagesComplete}
                    key={stage.id}
                    onClick={() => moveToStage(index)}
                    type="button"
                  >
                    {stageTitle(stage)} {completed ? "✓" : current ? "●" : "○"}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <div
        className="grid grid-cols-1 lg:min-h-0 lg:flex-1 lg:grid-cols-[var(--sidebar-width)_1fr]"
        style={{ "--sidebar-width": sidebarCollapsed ? "48px" : `${sidebarWidth}px` } as CSSProperties & Record<"--sidebar-width", string>}
      >
        <aside className="relative min-h-0 border-b border-line bg-panel lg:border-b-0 lg:border-r">
          {sidebarCollapsed ? (
            <button
              aria-label="Expand task and database panel"
              className="flex h-full w-full items-start justify-center pt-4 text-slate-400 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand"
              onClick={() => setSidebarCollapsed(false)}
              type="button"
            >
              <PanelLeftOpen size={20} />
            </button>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <div className="grid flex-1 grid-cols-2 rounded-lg border border-line bg-ink p-1 text-xs">
                  <button className={`rounded px-2 py-1.5 ${sidebarTab === "task" ? "bg-brand/15 text-brand" : "text-slate-400"}`} onClick={() => setSidebarTab("task")} type="button">Task</button>
                  <button className={`rounded px-2 py-1.5 ${sidebarTab === "database" ? "bg-brand/15 text-brand" : "text-slate-400"}`} onClick={() => setSidebarTab("database")} type="button">Database</button>
                </div>
                <button
                  aria-label="Collapse task and database panel"
                  className="ml-2 rounded border border-line p-2 text-slate-400 hover:border-brand/40 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand"
                  onClick={() => setSidebarCollapsed(true)}
                  type="button"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                {sidebarTab === "task" ? (
                  <div className="space-y-4 p-4">
                    <section>
                      <p className="text-xs font-semibold uppercase tracking-wider text-cyan">Task</p>
                      <h2 className="mt-2 text-lg font-semibold text-slate-50">{activeStage.title}</h2>
                      <div className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">{activeStage.instructions}</div>
                      <p className="mt-3 text-xs text-slate-500">{lesson.difficulty} • ~{lesson.estimatedMinutes} min</p>
                    </section>
                    <section className="rounded-lg border border-line bg-elevated p-3">
                      <button className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-50" onClick={() => setShowTutor((value) => !value)} type="button">
                        <span className="inline-flex items-center gap-2"><BookOpen size={16} /> Lesson Coach</span>
                        <span className="text-cyan">{showTutor ? "Hide" : "Open"}</span>
                      </button>
                      {showTutor && (
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                          You are working on {activeStage.title}. Focus on this request: {activeStage.instructions.split("\n")[0]} {activeChallenge ? "Run a query that returns the requested business output." : "Read the concept, then continue when it makes sense."}
                        </p>
                      )}
                    </section>
                    <section className="rounded-lg border border-line bg-elevated p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-50"><Lightbulb size={16} /> Hints</p>
                        {canRevealMoreHints && (
                          <button className="rounded border border-line px-3 py-1 text-xs text-slate-300 hover:border-brand-strong/50" onClick={() => setHintCount((value) => value + 1)} type="button">
                            Show Hint {hintCount + 1}
                          </button>
                        )}
                      </div>
                      <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                        {visibleHints.length ? visibleHints.map((hint, index) => <p key={hint}>Hint {index + 1}: {hint}</p>) : <p className="text-slate-500">{activeChallenge ? "Need direction? Reveal one hint at a time." : "No SQL hints needed for this concept stage."}</p>}
                      </div>
                    </section>
                  </div>
                ) : (
                  <SchemaExplorer className="h-full bg-panel p-4" schema={schema} />
                )}
              </div>
              <div
                aria-label="Resize task and database panel"
                className="absolute bottom-0 right-[-3px] top-0 hidden w-1 cursor-col-resize bg-transparent hover:bg-brand/40 lg:block"
                onPointerDown={(event) => startSidebarResize(event, setSidebarWidth)}
                role="separator"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft") setSidebarWidth((value) => clamp(value - 16, 260, 450));
                  if (event.key === "ArrowRight") setSidebarWidth((value) => clamp(value + 16, 260, 450));
                }}
              />
            </div>
          )}
        </aside>

        <section className="flex min-h-[640px] min-w-0 flex-col overflow-hidden lg:min-h-0">
          {error && <div className="border-b border-red-900/60 bg-red-950/40 px-6 py-3 text-sm text-red-100">{error}</div>}
          {progressMessage && <div className="border-b border-cyan/30 bg-cyan/10 px-6 py-3 text-sm text-cyan">{progressMessage}</div>}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line bg-elevated px-5 py-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{activeChallenge ? "SQL Editor" : "Concept"}</p>
              <p className="mt-1 text-xs text-slate-500">{course.shortTitle} • {stageTitle(activeStage)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeChallenge && executionStatus(result, running, error) && <span className={`text-xs ${statusTone(result, running, error)}`}>{executionStatus(result, running, error)}</span>}
              {activeChallenge && (
                <>
                  <button className="inline-flex h-9 items-center gap-2 rounded border border-line px-3 text-sm text-slate-300 hover:border-brand-strong/50" onClick={() => setQuery(activeStage.starterSql ?? "")} type="button">
                    <RotateCcw size={15} />
                    Reset
                  </button>
                  <button className="inline-flex h-9 items-center gap-2 rounded bg-brand px-4 text-sm font-semibold text-slate-950 disabled:cursor-wait disabled:bg-slate-700 disabled:text-slate-400" disabled={running} onClick={runQuery} type="button">
                    <Play size={16} fill="currentColor" />
                    {running ? "Running..." : "Run Query"}
                  </button>
                  <span className="hidden text-xs text-slate-500 md:inline">Ctrl/⌘ + Enter</span>
                </>
              )}
              {canContinue && activeStageIndex < stages.length - 1 && (
                <button className="inline-flex h-9 items-center rounded bg-brand px-4 text-sm font-semibold text-slate-950" onClick={continueToNextStage} type="button">
                  Continue to {stageTitle(stages[activeStageIndex + 1])}
                </button>
              )}
              {allStagesCompleted && activeStageIndex === stages.length - 1 && (
                <Link className="inline-flex h-9 items-center rounded bg-brand px-4 text-sm font-semibold text-slate-950" href="/learn">Complete Lesson</Link>
              )}
            </div>
          </div>

          {activeChallenge ? (
            <div className="flex min-h-0 flex-1 flex-col bg-editor">
              <SqlEditor className="min-h-[180px] shrink-0 border-b border-line" style={{ height: editorHeight }} value={query} onChange={setQuery} onRun={runQuery} />
              <div
                aria-label="Resize SQL editor and results"
                className="h-2 shrink-0 cursor-row-resize border-y border-line bg-panel hover:bg-brand/20 focus-visible:ring-2 focus-visible:ring-brand"
                onDoubleClick={() => setEditorPercent(52)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp") setEditorPercent((value) => clamp(value - 5, 36, 68));
                  if (event.key === "ArrowDown") setEditorPercent((value) => clamp(value + 5, 36, 68));
                  if (event.key === "Home") setEditorPercent(36);
                  if (event.key === "End") setEditorPercent(68);
                }}
                onPointerDown={(event) => startEditorResize(event, setEditorPercent)}
                role="separator"
                tabIndex={0}
              />
              <div className="min-h-[180px] flex-1 overflow-hidden" style={{ height: resultsHeight }}>
                <div className="flex h-full min-h-0 flex-col bg-editor text-slate-200">
                  <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-2">
                    <div className="flex gap-1 text-xs font-semibold uppercase tracking-wider">
                      <ResultTab active={resultTab === "results"} onClick={() => setResultTab("results")}>Results</ResultTab>
                      <ResultTab active={resultTab === "feedback"} onClick={() => setResultTab("feedback")}>Feedback</ResultTab>
                      <ResultTab active={resultTab === "breakdown"} disabled={!result?.success} onClick={() => setResultTab("breakdown")}>Query Breakdown</ResultTab>
                    </div>
                    {result?.success && <span className="text-xs text-slate-500">{result.rowCount} rows</span>}
                  </div>
                  <div className="min-h-0 flex-1 overflow-auto">
                    {resultTab === "results" && <ResultsTable result={result} />}
                    {resultTab === "feedback" && <FeedbackPanel activeStage={activeStage} lessonPrompt={lesson.interpretationPrompt} result={result} />}
                    {resultTab === "breakdown" && (
                      <ol className="space-y-2 p-5 text-sm leading-6 text-slate-300">
                        {explainQuery(query, result, activeStage, activeChallenge).map((line) => <li key={line}>{line}</li>)}
                      </ol>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-editor px-6 py-10 text-center">
              <div className="max-w-xl">
                <p className="font-mono text-xs uppercase tracking-wider text-cyan">Concept Stage</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">{activeStage.title}</h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">{activeStage.instructions}</p>
                {activeStageIndex < stages.length - 1 && (
                  <button className="mt-6 rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950" onClick={continueToNextStage} type="button">
                    Continue to {stageTitle(stages[activeStageIndex + 1])}
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function isStageCompleted(stage: LessonStageDefinition, progress: ProgressRow[], completedConceptStages: Set<string>) {
  if (!stage.challengeId) return completedConceptStages.has(stage.id);
  return progress.some((row) => row.challenge_id === stage.challengeId && row.status === "completed");
}

function storageKey(userId: string, lessonId: string) {
  return `queryright:lesson:${userId}:${lessonId}:active-stage`;
}

function conceptStorageKey(userId: string) {
  return `queryright:lesson:${userId}:completed-concepts`;
}

function workspaceSplitKey(userId: string) {
  return `queryright:workspace:${userId}:editor-results-split`;
}

function sidebarWidthKey(userId: string) {
  return `queryright:workspace:${userId}:sidebar-width`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function startSidebarResize(event: PointerEvent<HTMLDivElement>, setSidebarWidth: Dispatch<SetStateAction<number>>) {
  event.preventDefault();
  const startX = event.clientX;
  setSidebarWidth((initialWidth) => {
    function handleMove(moveEvent: globalThis.PointerEvent) {
      setSidebarWidth(clamp(initialWidth + moveEvent.clientX - startX, 260, 450));
    }

    function handleUp() {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
    }

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    return initialWidth;
  });
}

function startEditorResize(event: PointerEvent<HTMLDivElement>, setEditorPercent: Dispatch<SetStateAction<number>>) {
  event.preventDefault();
  const container = event.currentTarget.parentElement;
  if (!container) return;
  const rect = container.getBoundingClientRect();

  function handleMove(moveEvent: globalThis.PointerEvent) {
    const next = ((moveEvent.clientY - rect.top) / rect.height) * 100;
    setEditorPercent(clamp(next, 36, 68));
  }

  function handleUp() {
    document.removeEventListener("pointermove", handleMove);
    document.removeEventListener("pointerup", handleUp);
  }

  document.addEventListener("pointermove", handleMove);
  document.addEventListener("pointerup", handleUp);
}

function ResultTab({
  active,
  children,
  disabled = false,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded px-3 py-1.5 text-xs ${active ? "bg-brand/15 text-brand" : "text-slate-400 hover:bg-elevated hover:text-slate-50"} disabled:cursor-not-allowed disabled:text-slate-600`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function FeedbackPanel({ activeStage, lessonPrompt, result }: { activeStage: LessonStageDefinition; lessonPrompt: string; result: QueryResult | null }) {
  if (!result) {
    return <div className="p-5 text-sm text-slate-500">Run your query to see feedback.</div>;
  }

  if (!result.success) {
    return (
      <div className="p-5">
        <div className="mb-2 text-sm font-semibold text-red-300">Query error</div>
        <div className="rounded border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-100">{result.message ?? "The query could not be completed."}</div>
      </div>
    );
  }

  if (result.correct) {
    return (
      <div className="p-5 text-sm leading-6 text-green-100">
        <p className="font-semibold text-success">Correct.</p>
        <p className="mt-2">{activeStage.title} is complete.</p>
        <p className="mt-2 text-slate-300">{lessonPrompt}</p>
      </div>
    );
  }

  return (
    <div className="p-5 text-sm leading-6 text-amber">
      <p className="font-semibold">Almost there.</p>
      <p className="mt-2">{result.message ?? "Your SQL ran, but it does not match the active exercise yet."}</p>
    </div>
  );
}

function executionStatus(result: QueryResult | null, running: boolean, error: string | null) {
  if (running) return "Running query...";
  if (error) return "Query error";
  if (!result) return null;
  if (!result.success) return "Query error";
  if (result.correct) return `Correct · ${result.rowCount} rows`;
  return `Executed · ${result.rowCount} rows`;
}

function statusTone(result: QueryResult | null, running: boolean, error: string | null) {
  if (running) return "text-cyan";
  if (error || result?.success === false) return "text-red-300";
  if (result?.correct) return "text-success";
  if (result?.success) return "text-amber";
  return "text-slate-500";
}

function stageTitle(stage: LessonStageDefinition) {
  if (stage.type === "guided_exercise") return "Guided Exercise";
  if (stage.type === "business_task") return "Business Task";
  if (stage.type === "independent_exercise") return "Independent Exercise";
  return stage.type.charAt(0).toUpperCase() + stage.type.slice(1);
}

function explainQuery(query: string, result: QueryResult | null, stage: LessonStageDefinition, challenge: Challenge | null) {
  const normalized = query.replace(/\s+/g, " ").trim();
  const lines: string[] = [];
  const fromMatch = normalized.match(/\bfrom\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  const selectMatch = normalized.match(/\bselect\s+(.*?)\s+\bfrom\b/i);
  const whereMatch = normalized.match(/\bwhere\s+(.*?)(\bgroup\s+by\b|\border\s+by\b|\bhaving\b|$)/i);
  const groupMatch = normalized.match(/\bgroup\s+by\s+(.*?)(\border\s+by\b|\bhaving\b|$)/i);
  const orderMatch = normalized.match(/\border\s+by\s+(.*?)$/i);

  if (fromMatch) lines.push(`FROM ${fromMatch[1]} reads data from the ${fromMatch[1]} table.`);
  if (selectMatch) lines.push(`SELECT returns ${selectMatch[1].trim()}.`);
  lines.push(whereMatch ? `WHERE keeps only rows matching: ${whereMatch[1].trim()}.` : "There is no WHERE clause, so no row-level filter is applied.");
  if (groupMatch) {
    lines.push(`GROUP BY summarizes rows by ${groupMatch[1].trim()}.`);
  } else {
    lines.push("There is no GROUP BY because this query is returning row-level data rather than summarized groups.");
  }
  if (orderMatch) {
    lines.push(`ORDER BY controls result order using ${orderMatch[1].trim()}.`);
  } else {
    lines.push("There is no ORDER BY, so row order is not guaranteed.");
  }
  if (result?.correct) lines.push("This query satisfies the current business request.");
  if (result?.success && !result.correct && result.message) lines.push(`The query is valid SQL, but ${result.message.charAt(0).toLowerCase()}${result.message.slice(1)}`);
  if (!challenge) lines.push(`This is a ${stageTitle(stage).toLowerCase()} stage, so there is no SQL validation yet.`);
  return lines;
}
