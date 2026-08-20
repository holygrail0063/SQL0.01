"use client";

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChallengeNavigation } from "@/components/ChallengeNavigation";
import { ChallengePanel } from "@/components/ChallengePanel";
import { QueryStatus } from "@/components/QueryStatus";
import { ResultsTable } from "@/components/ResultsTable";
import { SchemaExplorer } from "@/components/SchemaExplorer";
import { SqlEditor } from "@/components/SqlEditor";
import { useAuth } from "@/lib/auth";
import { api, Challenge, QueryResult, SchemaTable } from "@/lib/api";
import { getProfile, recordAttempt } from "@/lib/progress";

export function ChallengeWorkspace({ challengeId }: { challengeId: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [sqlLevel, setSqlLevel] = useState<string | null>(null);

  const currentIndex = Math.max(0, challenges.findIndex((candidate) => candidate.id === challengeId));
  const challenge = challenges[currentIndex];

  useEffect(() => {
    Promise.all([api.challenges(), api.schema()])
      .then(([challengeData, schemaData]) => {
        setChallenges(challengeData);
        setSchema(schemaData);
        setQuery("");
      })
      .catch((caught) => setAppError(readableError(caught, "QueryRight could not reach the SQLBank API.")))
      .finally(() => setLoading(false));
  }, [challengeId]);

  useEffect(() => {
    if (!user) return;
    getProfile(user)
      .then((profile) => setSqlLevel(profile?.sql_level ?? null))
      .catch(() => setSqlLevel(null));
  }, [user]);

  useEffect(() => {
    if (challenge) {
      setQuery("");
      setResult(null);
      setProgressMessage(null);
    }
  }, [challenge?.id]);

  async function runQuery() {
    if (!challenge) return;
    setRunning(true);
    setAppError(null);
    setProgressMessage(null);
    try {
      const queryResult = await api.runQuery(challenge.id, query);
      setResult(queryResult);
      if (user) {
        try {
          await recordAttempt(user, challenge.id, query, queryResult);
          if (queryResult.correct) {
            setProgressMessage("Progress saved.");
          }
        } catch {
          setProgressMessage("Your query ran, but progress could not be saved.");
        }
      }
    } catch (caught) {
      setResult(null);
      setAppError(readableError(caught, "The query request failed. Check that FastAPI is running."));
    } finally {
      setRunning(false);
    }
  }

  const canMoveNext = useMemo(() => Boolean(result?.success && result.correct), [result]);

  if (loading) {
    return <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-ink text-slate-300">Loading SQLBank workspace...</main>;
  }

  if (!challenge) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-ink px-5 text-center text-red-200">
        {appError ?? "This SQLBank challenge was not found."}
      </main>
    );
  }

  return (
    <main className="grid min-h-[calc(100vh-4rem)] grid-cols-1 bg-ink text-slate-100 lg:grid-cols-[320px_1fr]">
      <SchemaExplorer schema={schema} />
      <div className="flex min-w-0 flex-col">
        <header className="flex min-h-14 items-center justify-between gap-4 border-b border-line bg-[#0a1322] px-6 py-3">
          <div>
            <div className="text-lg font-semibold text-white">SQLBank Analytics Team</div>
            <div className="font-mono text-xs uppercase tracking-wider text-slate-500">SQLBankTraining</div>
          </div>
          <ChallengeNavigation
            canGoPrevious={currentIndex > 0}
            canGoNext={currentIndex < challenges.length - 1}
            nextEnabled={canMoveNext}
            onPrevious={() => router.push(`/challenge/${challenges[currentIndex - 1].id}`)}
            onNext={() => router.push(`/challenge/${challenges[currentIndex + 1].id}`)}
          />
        </header>

        <ChallengePanel challenge={challenge} current={currentIndex + 1} total={challenges.length} sqlLevel={sqlLevel} />

        {appError && <div className="border-b border-red-900/60 bg-red-950/40 px-6 py-3 text-sm text-red-100">{appError}</div>}
        {progressMessage && <div className="border-b border-cyan/30 bg-cyan/10 px-6 py-3 text-sm text-cyan">{progressMessage}</div>}

        <section className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-[#0b1525] px-6 py-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">SQL Editor</div>
            <div className="flex items-center gap-4">
              <QueryStatus result={result} />
              <button
                className="inline-flex h-9 items-center gap-2 rounded bg-brand px-4 text-sm font-semibold text-white disabled:cursor-wait disabled:bg-slate-700 disabled:text-slate-400"
                disabled={running}
                onClick={runQuery}
                type="button"
              >
                <Play size={16} fill="currentColor" />
                {running ? "Running..." : "Run Query"}
              </button>
            </div>
          </div>
          <SqlEditor value={query} onChange={setQuery} />
          {result?.success && result.correct && (
            <div className="border-b border-success/40 bg-success/10 px-6 py-3 text-sm text-green-100">
              Correct. Your query returned the expected result.
            </div>
          )}
          {result?.success && !result.correct && result.message && (
            <div className="border-b border-amber/30 bg-amber/10 px-6 py-3 text-sm text-amber">
              Your query ran successfully, but the result doesn&apos;t match the requested output yet.
            </div>
          )}
          <div className="min-h-[320px] bg-[#091321]">
            <div className="border-b border-line px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Results</div>
            <ResultsTable result={result} />
          </div>
        </section>
      </div>
    </main>
  );
}

function readableError(caught: unknown, fallback: string): string {
  return caught instanceof Error ? caught.message : fallback;
}
