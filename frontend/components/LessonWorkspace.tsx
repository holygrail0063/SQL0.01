"use client";

import Link from "next/link";
import { BookOpen, CheckCircle2, Circle, Lightbulb, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { QueryStatus } from "@/components/QueryStatus";
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
  const [showExplanation, setShowExplanation] = useState(false);
  const [completedConceptStages, setCompletedConceptStages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

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
    setShowExplanation(false);
    setProgressMessage(null);
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

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-ink text-slate-50">
      <header className="border-b border-line bg-panel px-5 py-5">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs uppercase tracking-wider text-cyan">{course.learningGoal} Path / Module {module.sequence} / Lesson {lesson.sequence}</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-50">{lesson.title}</h1>
              <p className="mt-2 text-sm text-slate-400">{lesson.difficulty} • {lesson.estimatedMinutes} min • {lesson.skills.join(", ")}</p>
            </div>
            <Link className="rounded border border-line px-4 py-2 text-sm font-semibold text-slate-300 hover:border-brand-strong/50" href="/learn">Back to Course</Link>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 lg:grid-cols-[360px_1fr]">
        <aside className="border-b border-line bg-panel lg:border-b-0 lg:border-r">
          <div className="space-y-5 p-5">
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stage Progress</p>
              <div className="mt-3 space-y-2">
                {stages.map((stage, index) => {
                  const completed = isStageCompleted(stage, progress, completedConceptStages) || (stage.id === activeStage?.id && Boolean(result?.correct));
                  const current = index === activeStageIndex;
                  const previousStagesComplete = stages.slice(0, index).every((candidate) => isStageCompleted(candidate, progress, completedConceptStages));
                  return (
                    <button
                      className={`flex w-full items-center gap-2 rounded border px-3 py-2 text-left text-sm ${current ? "border-brand-strong bg-brand/25 text-slate-50" : completed ? "border-line text-slate-300" : "border-transparent text-slate-500"}`}
                      disabled={!previousStagesComplete}
                      key={stage.id}
                      onClick={() => moveToStage(index)}
                      type="button"
                    >
                      {completed ? <CheckCircle2 size={16} className="text-success" /> : <Circle size={16} />}
                      <span>{index + 1}. {stageTitle(stage)}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-lg border border-line bg-elevated p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan">Stage {activeStageIndex + 1} of {stages.length}</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-50">{activeStage.title}</h2>
              <div className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">{activeStage.instructions}</div>
            </section>

            <section className="rounded-lg border border-line bg-elevated p-4">
              <button className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-50" onClick={() => setShowTutor((value) => !value)} type="button">
                <span className="inline-flex items-center gap-2"><BookOpen size={16} /> Lesson Coach</span>
                <span className="text-cyan">{showTutor ? "Hide" : "Open"}</span>
              </button>
              {showTutor && (
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  You are working on {activeStage.title}. Focus only on this stage&apos;s request: {activeStage.instructions.split("\n")[0]} {activeChallenge ? "Run a query that returns the same business output, not necessarily the same formatting." : "Read the concept, then continue when it makes sense."}
                </p>
              )}
            </section>

            <section className="rounded-lg border border-line bg-elevated p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-50"><Lightbulb size={16} /> Hints</p>
                {canRevealMoreHints && (
                  <button className="rounded border border-line px-3 py-1 text-xs text-slate-300 hover:border-brand-strong/50" onClick={() => setHintCount((value) => value + 1)} type="button">
                    Show Hint {hintCount + 1}
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                {visibleHints.length ? visibleHints.map((hint, index) => <p key={hint}>Hint {index + 1}: {hint}</p>) : <p className="text-slate-500">{activeChallenge ? "Use hints only when you need direction." : "No SQL hints needed for this concept stage."}</p>}
              </div>
            </section>
          </div>
          <SchemaExplorer schema={schema} />
        </aside>

        <section className="flex min-w-0 flex-col">
          {error && <div className="border-b border-red-900/60 bg-red-950/40 px-6 py-3 text-sm text-red-100">{error}</div>}
          {progressMessage && <div className="border-b border-cyan/30 bg-cyan/10 px-6 py-3 text-sm text-cyan">{progressMessage}</div>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-elevated px-6 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{activeChallenge ? "SQL Editor" : "Concept"}</p>
              <p className="mt-1 text-xs text-slate-500">{course.shortTitle} • {stageTitle(activeStage)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {activeChallenge && <QueryStatus result={result} />}
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
            <>
          <SqlEditor value={query} onChange={setQuery} onRun={runQuery} />
              {result?.success && result.correct && (
                <div className="border-b border-success/40 bg-success/10 px-6 py-3 text-sm text-green-100">
                  Correct. {activeStage.title} is complete. {activeStageIndex < stages.length - 1 ? "Continue when you are ready for the next stage." : lesson.interpretationPrompt}
                </div>
              )}
              {result?.success && !result.correct && (
                <div className="border-b border-amber/30 bg-amber/10 px-6 py-3 text-sm text-amber">
                  {result.message ?? "Your SQL ran, but it does not match the active exercise yet."}
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center bg-editor px-6 py-10 text-center">
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

          <div className="grid min-h-[320px] grid-cols-1 bg-editor text-slate-200 xl:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <div className="border-b border-line px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Results</div>
              <ResultsTable result={activeChallenge ? result : null} />
            </div>
            <aside className="border-t border-line p-5 xl:border-l xl:border-t-0">
              <button className="text-sm font-semibold text-cyan hover:text-white disabled:text-slate-400" disabled={!result?.success} onClick={() => setShowExplanation((value) => !value)} type="button">
                Query Breakdown
              </button>
              {showExplanation && (
                <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-300">
                  {explainQuery(query, result, activeStage, activeChallenge).map((line) => <li key={line}>{line}</li>)}
                </ol>
              )}
            </aside>
          </div>
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
