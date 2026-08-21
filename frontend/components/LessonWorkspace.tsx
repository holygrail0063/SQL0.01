"use client";

import Link from "next/link";
import { BookOpen, Lightbulb, Play, RotateCcw, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { QueryStatus } from "@/components/QueryStatus";
import { ResultsTable } from "@/components/ResultsTable";
import { SchemaExplorer } from "@/components/SchemaExplorer";
import { SqlEditor } from "@/components/SqlEditor";
import { api, type Challenge, type QueryResult, type SchemaTable } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { challengeForLesson, getLessonById } from "@/lib/course";
import { recordAttempt } from "@/lib/progress";

export function LessonWorkspace({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const lessonBundle = useMemo(() => getLessonById(lessonId), [lessonId]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [hintCount, setHintCount] = useState(0);
  const [showTutor, setShowTutor] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.challenges(), api.schema()])
      .then(([challengeData, schemaData]) => {
        setChallenges(challengeData);
        setSchema(schemaData);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Lesson data could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setQuery("");
    setResult(null);
    setHintCount(0);
    setShowTutor(false);
    setShowExplanation(false);
    setProgressMessage(null);
  }, [lessonId]);

  if (loading) return <main className="p-8 text-slate-400">Preparing your lesson...</main>;
  if (!lessonBundle) return <main className="p-8 text-red-200">This lesson was not found.</main>;

  const { course, module, lesson } = lessonBundle;
  const challenge = challengeForLesson(lesson, challenges);

  async function runQuery() {
    if (!challenge) return;
    setRunning(true);
    setError(null);
    setProgressMessage(null);
    try {
      const queryResult = await api.runQuery(challenge.id, query);
      setResult(queryResult);
      if (user) {
        await recordAttempt(user, challenge.id, query, queryResult);
        if (queryResult.correct) setProgressMessage("Lesson progress saved.");
      }
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "The query request failed.");
    } finally {
      setRunning(false);
    }
  }

  const visibleHints = lesson.hints.slice(0, hintCount);
  const canRevealMoreHints = hintCount < lesson.hints.length;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-ink text-slate-100">
      <header className="border-b border-line bg-panel px-5 py-5">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs uppercase tracking-wider text-cyan">{course.learningGoal} Path / Module {module.sequence} / Lesson {lesson.sequence}</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-white">{lesson.title}</h1>
              <p className="mt-2 text-sm text-slate-400">{lesson.difficulty} • {lesson.estimatedMinutes} min • {lesson.skills.join(", ")}</p>
            </div>
            <Link className="rounded border border-line px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan/70" href="/learn">Back to Course</Link>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 lg:grid-cols-[360px_1fr]">
        <aside className="border-b border-line bg-[#0a1322] lg:border-b-0 lg:border-r">
          <div className="space-y-5 p-5">
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan">Stage 1 - Concept</p>
              <h2 className="mt-2 text-lg font-semibold text-white">{challenge?.title ?? lesson.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{lesson.concept}</p>
            </section>
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stage 2 - Guided Exercise</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{lesson.guidedPrompt}</p>
            </section>
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stage 3 - Business Task</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{lesson.independentPrompt}</p>
            </section>
            <section className="rounded border border-line bg-[#090f1a] p-4">
              <button className="flex w-full items-center justify-between text-left text-sm font-semibold text-white" onClick={() => setShowTutor((value) => !value)} type="button">
                <span className="inline-flex items-center gap-2"><BookOpen size={16} /> Ask QueryRight</span>
                <span className="text-cyan">{showTutor ? "Hide" : "Open"}</span>
              </button>
              {showTutor && (
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  I can help you build the query without giving away the answer. Start by naming the grain: one row per customer, account, transaction, application, branch, or summary group?
                </p>
              )}
            </section>
            <section className="rounded border border-line bg-[#090f1a] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-white"><Lightbulb size={16} /> Hints</p>
                {canRevealMoreHints && (
                  <button className="rounded border border-line px-3 py-1 text-xs text-slate-300 hover:border-cyan/70" onClick={() => setHintCount((value) => value + 1)} type="button">
                    Show Hint {hintCount + 1}
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                {visibleHints.length ? visibleHints.map((hint, index) => <p key={hint}>Hint {index + 1}: {hint}</p>) : <p className="text-slate-500">Use hints only when you need direction.</p>}
              </div>
            </section>
          </div>
          <SchemaExplorer schema={schema} />
        </aside>

        <section className="flex min-w-0 flex-col">
          {error && <div className="border-b border-red-900/60 bg-red-950/40 px-6 py-3 text-sm text-red-100">{error}</div>}
          {progressMessage && <div className="border-b border-cyan/30 bg-cyan/10 px-6 py-3 text-sm text-cyan">{progressMessage}</div>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-[#0b1525] px-6 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">SQL Editor</p>
              <p className="mt-1 text-xs text-slate-500">{course.shortTitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <QueryStatus result={result} />
              <button className="inline-flex h-9 items-center gap-2 rounded border border-line px-3 text-sm text-slate-300 hover:border-cyan/70" onClick={() => setQuery(formatSql(query))} type="button">
                <Wand2 size={15} />
                Format
              </button>
              <button className="inline-flex h-9 items-center gap-2 rounded border border-line px-3 text-sm text-slate-300 hover:border-cyan/70" onClick={() => setQuery("")} type="button">
                <RotateCcw size={15} />
                Reset
              </button>
              <button className="inline-flex h-9 items-center gap-2 rounded bg-brand px-4 text-sm font-semibold text-white disabled:cursor-wait disabled:bg-slate-700 disabled:text-slate-400" disabled={running || !challenge} onClick={runQuery} type="button">
                <Play size={16} fill="currentColor" />
                {running ? "Running..." : "Run Query"}
              </button>
            </div>
          </div>
          <SqlEditor value={query} onChange={setQuery} />
          {result?.success && result.correct && (
            <div className="border-b border-success/40 bg-success/10 px-6 py-3 text-sm text-green-100">
              Lesson Complete. You practiced {lesson.skills.slice(0, 3).join(", ")}. {lesson.interpretationPrompt}
            </div>
          )}
          {result?.success && !result.correct && (
            <div className="border-b border-amber/30 bg-amber/10 px-6 py-3 text-sm text-amber">
              Logic Error: your SQL ran, but the result does not match the business request yet. Compare your selected columns, filters, grouping, and sort order.
            </div>
          )}
          <div className="grid min-h-[320px] grid-cols-1 bg-[#091321] xl:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <div className="border-b border-line px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Results</div>
              <ResultsTable result={result} />
            </div>
            <aside className="border-t border-line p-5 xl:border-l xl:border-t-0">
              <button className="text-sm font-semibold text-cyan hover:text-white disabled:text-slate-600" disabled={!result?.success} onClick={() => setShowExplanation((value) => !value)} type="button">
                Explain My Query
              </button>
              {showExplanation && (
                <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-300">
                  <li>FROM identifies the SQLBank table or joined tables.</li>
                  <li>WHERE reduces rows to the business conditions you requested.</li>
                  <li>GROUP BY, when present, creates one row per business category.</li>
                  <li>SELECT decides which fields or metrics the stakeholder receives.</li>
                  <li>The result should be interpreted as a business answer, not just a table.</li>
                </ol>
              )}
              {result?.success && result.correct && (
                <div className="mt-6 space-y-3">
                  <Link className="inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-white" href="/learn">Continue to Next Lesson</Link>
                  <Link className="ml-3 inline-flex rounded border border-line px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan/70" href="/dashboard">Dashboard</Link>
                </div>
              )}
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatSql(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\b(select|from|where|and|or|join|inner join|left join|group by|order by|having)\b/gi, (match) => `\n${match.toUpperCase()}`)
    .trim();
}
