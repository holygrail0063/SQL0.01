"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
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
  const [sqlLevel, setSqlLevel] = useState("Know the Basics");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function complete() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await saveProfile(user, {
        selected_role: selectedRole,
        sql_level: sqlLevel,
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
      <h1 className="mt-3 text-3xl font-semibold text-white">{step === 1 ? "What are you learning SQL for?" : "What's your current SQL level?"}</h1>

      {step === 1 ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roleOptions.map((role) => (
            <button
              className={selectedRole === role ? "rounded border border-brand bg-brand/20 p-5 text-left text-white shadow-[0_0_0_1px_rgba(79,124,255,0.45)]" : "rounded border border-line bg-panel p-5 text-left text-slate-300 hover:border-cyan/70"}
              key={role}
              onClick={() => setSelectedRole(role)}
              type="button"
            >
              <span className="flex items-center justify-between gap-3">
                <span>{role}</span>
                {selectedRole === role && <span className="font-mono text-xs text-cyan">Selected</span>}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {sqlLevelOptions.map((level) => (
            <button
              className={sqlLevel === level.value ? "rounded border border-brand bg-brand/20 p-5 text-left text-white shadow-[0_0_0_1px_rgba(79,124,255,0.45)]" : "rounded border border-line bg-panel p-5 text-left text-slate-300 hover:border-cyan/70"}
              key={level.value}
              onClick={() => setSqlLevel(level.value)}
              type="button"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold">{level.value}</span>
                {sqlLevel === level.value && <span className="font-mono text-xs text-cyan">Selected</span>}
              </span>
              <span className="mt-2 block text-sm leading-6 text-slate-400">{level.description}</span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-6 rounded border border-red-900/70 bg-red-950/40 p-3 text-sm text-red-100">{error}</p>}

      <div className="mt-8 flex justify-between gap-3">
        <button className="rounded border border-line px-4 py-2 text-sm text-slate-300 disabled:opacity-40" disabled={step === 1} onClick={() => setStep(1)} type="button">
          Back
        </button>
        {step === 1 ? (
          <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={() => setStep(2)} type="button">
            Continue
          </button>
        ) : (
          <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-700" disabled={loading} onClick={complete} type="button">
            {loading ? "Saving..." : "Finish Onboarding"}
          </button>
        )}
      </div>
    </main>
  );
}
