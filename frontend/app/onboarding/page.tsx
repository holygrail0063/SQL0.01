"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { dailyCommitmentOptions, getBusinessAnalystCourse } from "@/lib/course";
import { roleOptions, sqlLevelOptions } from "@/lib/curriculum";
import { saveProfile } from "@/lib/progress";

function readableError(caught: unknown) {
  if (caught instanceof Error) return caught.message;
  if (typeof caught === "string") return caught;
  try {
    return JSON.stringify(caught);
  } catch {
    return "Unknown Supabase error.";
  }
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <OnboardingContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function OnboardingContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("Business Analyst");
  const [sqlLevel, setSqlLevel] = useState("Completely New");
  const [dailyCommitment, setDailyCommitment] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const selectedCourse = selectedRole === "Business Analyst" ? getBusinessAnalystCourse(sqlLevel) : null;

  async function complete() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await saveProfile(user, {
        selected_role: selectedRole,
        sql_level: sqlLevel,
        daily_commitment_minutes: dailyCommitment,
        onboarding_completed: true,
      });
      router.replace("/dashboard?welcome=1");
    } catch (caught) {
      setError(`Onboarding could not be saved. ${readableError(caught)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <p className="font-mono text-sm text-cyan">QueryRight onboarding</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">
        {step === 1 && "Welcome to SQLBank"}
        {step === 2 && "This is not a normal SQL course"}
        {step === 3 && "Your Business Analyst Path"}
      </h1>

      {step === 1 ? (
        <div className="mt-8 rounded border border-line bg-panel p-6">
          <p className="max-w-3xl text-lg leading-8 text-slate-300">
            You are joining SQLBank as a Business Analyst. During training you will work with realistic customer, lending, transaction, and operational data. Your job will gradually evolve from simple data requests to full business investigations.
          </p>
        </div>
      ) : step === 2 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Learn", "Learn one SQL concept in a business context."],
            ["Practice", "Use it in a focused exercise."],
            ["SQLBank", "Solve a realistic manager request."],
            ["Review", "QueryRight tracks what you actually understand."],
          ].map(([title, copy], index) => (
            <div className="rounded border border-line bg-panel p-5" key={title}>
              <p className="font-mono text-xs text-cyan">0{index + 1}</p>
              <h2 className="mt-4 font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="space-y-5 rounded border border-line bg-panel p-6">
            <label className="block text-sm text-slate-300">
              Learning Goal
              <select className="mt-2 h-11 w-full rounded border border-line bg-[#090f1a] px-3 text-white outline-none focus:border-brand" onChange={(event) => setSelectedRole(event.target.value)} value={selectedRole}>
                {roleOptions.map((role) => <option key={role}>{role}</option>)}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              SQL Experience
              <select className="mt-2 h-11 w-full rounded border border-line bg-[#090f1a] px-3 text-white outline-none focus:border-brand" onChange={(event) => setSqlLevel(event.target.value)} value={sqlLevel}>
                {sqlLevelOptions.map((level) => <option key={level.value}>{level.value}</option>)}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Recommended Daily Commitment
              <select className="mt-2 h-11 w-full rounded border border-line bg-[#090f1a] px-3 text-white outline-none focus:border-brand" onChange={(event) => setDailyCommitment(Number(event.target.value))} value={dailyCommitment}>
                {dailyCommitmentOptions.map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
              </select>
            </label>
          </section>
          <section className="rounded border border-line bg-panel p-6">
            {selectedCourse ? (
              <>
                <p className="font-mono text-xs uppercase tracking-wider text-cyan">Your Path</p>
                <h2 className="mt-3 text-xl font-semibold text-white">{selectedCourse.shortTitle}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{selectedCourse.estimatedWeeks}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{dailyCommitment} min/day</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{selectedCourse.difficulty}</p>
              </>
            ) : (
              <>
                <p className="font-mono text-xs uppercase tracking-wider text-cyan">Coming Soon</p>
                <h2 className="mt-3 text-xl font-semibold text-white">{selectedRole}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">This pathway is being built. Select Business Analyst to begin the current working curriculum.</p>
              </>
            )}
          </section>
        </div>
      )}

      {error && <p className="mt-6 rounded border border-red-900/70 bg-red-950/40 p-3 text-sm text-red-100">{error}</p>}

      <div className="mt-8 flex justify-between gap-3">
        <button className="rounded border border-line px-4 py-2 text-sm text-slate-300 disabled:opacity-40" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))} type="button">
          Back
        </button>
        {step < 3 ? (
          <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={() => setStep(step + 1)} type="button">
            {step === 1 ? "Start Training" : "Continue"}
          </button>
        ) : (
          <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-700" disabled={loading} onClick={complete} type="button">
            {loading ? "Saving..." : "Begin Day 1"}
          </button>
        )}
      </div>
    </main>
  );
}
