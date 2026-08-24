"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function HelpPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <main className="mx-auto max-w-3xl px-5 py-10">
          <p className="font-mono text-sm text-cyan">Account</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-50">Help</h1>
          <section className="mt-8 rounded-lg border border-line bg-panel p-6">
            <h2 className="text-lg font-semibold text-slate-50">Need a next step?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Open Learn to continue your curriculum, or use SQL Editor to resume your current task.</p>
            <Link className="mt-5 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950" href="/learn">Go to Learn</Link>
          </section>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
