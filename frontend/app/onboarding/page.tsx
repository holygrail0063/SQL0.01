"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { getCourseForSelection } from "@/lib/course";
import { activeSqlLevelOptions, roleOptions } from "@/lib/curriculum";
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
      <OnboardingContent />
    </ProtectedRoute>
  );
}

function OnboardingContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("");
  const [sqlLevel, setSqlLevel] = useState("");
  const dailyCommitment = 30;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const selectedCourse = getCourseForSelection(selectedRole, sqlLevel);
  const shouldShowSqlBankIntro = selectedRole === "Business Analyst" && sqlLevel === "Completely New";

  async function complete() {
    if (!user) return;
    if (!selectedRole || !sqlLevel) {
      setError("Choose a learning goal and SQL experience before continuing.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await saveProfile(user, {
        selected_role: selectedRole,
        sql_level: sqlLevel,
        daily_commitment_minutes: dailyCommitment,
        onboarding_completed: true,
      });
      router.replace("/learn");
    } catch (caught) {
      setError(`Onboarding could not be saved. ${readableError(caught)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-5 py-10 text-slate-50">
      <div className="mx-auto max-w-5xl">
      <BrandMark />
      <div className="mt-12">
        <p className="font-mono text-sm text-cyan">Step {Math.min(step, 2)} of 2</p>
        <div className="mt-3 flex max-w-xs items-center gap-3" aria-label={`Onboarding step ${Math.min(step, 2)} of 2`}>
          {[1, 2].map((item) => (
            <div className="flex flex-1 items-center gap-3" key={item}>
              <span className={item <= Math.min(step, 2) ? "h-3 w-3 rounded-full border border-brand-strong bg-brand" : "h-3 w-3 rounded-full border border-slate-300 bg-panel"} />
              {item < 2 && <span className={item < Math.min(step, 2) ? "h-px flex-1 bg-brand-strong" : "h-px flex-1 bg-line"} />}
            </div>
          ))}
        </div>
      </div>
      <h1 className="mt-6 text-3xl font-semibold text-slate-50">
        {step === 1 && "What are you learning SQL for?"}
        {step === 2 && "What's your current SQL level?"}
        {step === 3 && "Welcome to SQLBank"}
      </h1>

      {step === 1 ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roleOptions.map((role) => {
            const supported = role === "Business Analyst" || role === "Data Analyst";
            return (
            <button
              className={selectedRole === role ? "rounded-lg border border-brand-strong bg-brand/30 p-5 text-left text-slate-50 shadow-[0_0_0_1px_rgba(77,124,15,0.24)]" : supported ? "rounded-lg border border-line bg-panel p-5 text-left text-slate-300 hover:border-brand-strong/50" : "rounded-lg border border-line bg-elevated p-5 text-left text-slate-500 opacity-75"}
              disabled={!supported}
              key={role}
              onClick={() => {
                setSelectedRole(role);
                setError(null);
              }}
              type="button"
            >
              <span className="flex items-center justify-between gap-3">
                <span>{role}</span>
                {selectedRole === role && <span className="font-mono text-xs text-brand-strong">Selected</span>}
                {!supported && <span className="font-mono text-xs text-slate-500">Coming soon</span>}
              </span>
            </button>
          )})}
        </div>
      ) : step === 2 ? (
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {activeSqlLevelOptions.map((level) => (
            <button
              className={sqlLevel === level.value ? "rounded-lg border border-brand-strong bg-brand/30 p-5 text-left text-slate-50 shadow-[0_0_0_1px_rgba(77,124,15,0.24)]" : "rounded-lg border border-line bg-panel p-5 text-left text-slate-300 hover:border-brand-strong/50"}
              key={level.value}
              onClick={() => {
                setSqlLevel(level.value);
                setError(null);
              }}
              type="button"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold">{level.value}</span>
                {sqlLevel === level.value && <span className="font-mono text-xs text-brand-strong">Selected</span>}
              </span>
              <span className="mt-2 block text-sm leading-6 text-slate-400">{level.description}</span>
            </button>
          ))}
        </div>
      ) : (
        <section className="mt-8 rounded-lg border border-line bg-panel p-6">
          <p className="max-w-3xl text-lg leading-8 text-slate-300">
            You are joining SQLBank as a Business Analyst. During training you will work with realistic customer, lending, transaction, and operational data. Your job will gradually evolve from simple data requests to full business investigations.
          </p>
          {selectedCourse && (
            <div className="mt-6 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <span>{selectedCourse.estimatedWeeks}</span>
              <span>{dailyCommitment} min/day</span>
              <span>{selectedCourse.difficulty}</span>
            </div>
          )}
        </section>
      )}

      {error && <p className="status-error mt-6 rounded border p-3 text-sm">{error}</p>}

      <div className="mt-8 flex justify-between gap-3">
        <button className="rounded border border-line px-4 py-2 text-sm text-slate-300 disabled:opacity-40" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))} type="button">
          Back
        </button>
        {step === 1 ? (
          <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950 disabled:bg-slate-700" disabled={!selectedRole} onClick={() => setStep(2)} type="button">
            Continue
          </button>
        ) : step === 2 ? (
          <button
            className="rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950 disabled:bg-slate-700"
            disabled={!sqlLevel || loading}
            onClick={() => {
              if (shouldShowSqlBankIntro) {
                setStep(3);
              } else {
                complete();
              }
            }}
            type="button"
          >
            {loading ? "Saving..." : shouldShowSqlBankIntro ? "Continue" : "Finish Onboarding"}
          </button>
        ) : (
          <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950 disabled:bg-slate-700" disabled={loading} onClick={complete} type="button">
            {loading ? "Saving..." : "Begin Day 1"}
          </button>
        )}
      </div>
      </div>
    </main>
  );
}
