"use client";

import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AppearancePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <main className="mx-auto max-w-3xl px-5 py-10">
          <p className="font-mono text-sm text-cyan">Account</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Appearance</h1>
          <section className="mt-8 rounded-lg border border-line bg-panel p-6">
            <h2 className="text-lg font-semibold text-slate-950">Theme</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">QueryRight currently uses the Lime Frost light theme for application screens and keeps SQL editors dark for readability.</p>
          </section>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
