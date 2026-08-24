"use client";

import Link from "next/link";
import { Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ResultsTable } from "@/components/ResultsTable";
import { SchemaExplorer } from "@/components/SchemaExplorer";
import { SqlEditor } from "@/components/SqlEditor";
import { api, type QueryResult, type SchemaTable } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { lastSqlWorkspaceKey } from "@/lib/sql-editor-state";

export default function SandboxPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <SandboxContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function SandboxContent() {
  const { user } = useAuth();
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    api.schema().then(setSchema);
  }, []);

  useEffect(() => {
    if (user) window.localStorage.setItem(lastSqlWorkspaceKey(user.id), "/practice/sandbox");
  }, [user]);

  async function runQuery() {
    setRunning(true);
    try {
      setResult(await api.runFreeQuery(query));
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-4rem)] grid-cols-1 bg-ink text-slate-50 lg:grid-cols-[320px_1fr]">
      <SchemaExplorer schema={schema} />
      <section className="flex min-w-0 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-panel px-6 py-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-cyan">SQLBank Sandbox</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-50">Sandbox</h1>
            <p className="mt-2 text-sm text-slate-400">Run read-only SQL against SQLBankTraining without correctness scoring.</p>
          </div>
          <Link className="rounded border border-line px-4 py-2 text-sm font-semibold text-slate-300 hover:border-brand-strong/50" href="/practice">Back to Practice</Link>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-elevated px-6 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">SQL Editor</p>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex h-9 items-center gap-2 rounded border border-line px-3 text-sm text-slate-300 hover:border-brand-strong/50" onClick={() => setQuery("")} type="button">
              <RotateCcw size={15} /> Reset
            </button>
            <button className="inline-flex h-9 items-center gap-2 rounded bg-brand px-4 text-sm font-semibold text-slate-950 disabled:bg-slate-700" disabled={running} onClick={runQuery} type="button">
              <Play size={16} fill="currentColor" /> {running ? "Running..." : "Run Query"}
            </button>
            <span className="hidden self-center text-xs text-slate-500 md:inline">Ctrl/⌘ + Enter</span>
          </div>
        </div>
        <SqlEditor value={query} onChange={setQuery} onRun={runQuery} />
        <div className="min-h-[320px] bg-editor text-slate-200">
          <div className="border-b border-line px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Results</div>
          <ResultsTable result={result} />
        </div>
      </section>
    </main>
  );
}
