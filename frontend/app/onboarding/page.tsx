"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { activeLearningModes, comingSoonLearningModes, type LearningModeId } from "@/lib/curriculum";
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
  const [selectedMode, setSelectedMode] = useState<LearningModeId | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function complete() {
    if (!user || !selectedMode) return;
    setLoading(true);
    setError(null);
    try {
      await saveProfile(user, {
        selected_role: null,
        sql_level: selectedMode,
        daily_commitment_minutes: 30,
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
        <section className="mt-14">
          <p className="font-mono text-sm text-cyan">QueryRight onboarding</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-50">How would you like to learn SQL?</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Choose the starting point that best matches your experience or goal.</p>

          <fieldset className="mt-8">
            <legend className="sr-only">Learning mode</legend>
            <div className="grid gap-3 md:grid-cols-2">
              {activeLearningModes().map((mode) => {
                const selected = selectedMode === mode.id;
                return (
                  <label
                    className={`group relative flex min-h-32 cursor-pointer rounded-lg border p-5 transition ${
                      selected ? "border-brand bg-brand/10 shadow-[0_0_0_1px_rgb(var(--color-brand)/0.24)]" : "border-line bg-panel hover:border-brand/50 hover:bg-brand/5"
                    }`}
                    key={mode.id}
                  >
                    <input
                      checked={selected}
                      className="peer sr-only"
                      name="learning-mode"
                      onChange={() => {
                        setSelectedMode(mode.id);
                        setError(null);
                      }}
                      type="radio"
                      value={mode.id}
                    />
                    <span className="pointer-events-none absolute inset-0 rounded-lg transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink" />
                    <span className="flex w-full items-start justify-between gap-4">
                      <span>
                        <span className="block text-lg font-semibold text-slate-50">{mode.label}</span>
                        <span className="mt-3 block text-sm leading-6 text-slate-400">{mode.description}</span>
                      </span>
                      <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-brand bg-brand text-brand-foreground" : "border-line text-transparent"}`} aria-hidden="true">
                        <Check size={14} />
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="mt-8 border-t border-line pt-6">
              <p className="font-mono text-xs uppercase tracking-wider text-slate-500">Coming Soon</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {comingSoonLearningModes().map((mode) => (
                  <div aria-disabled="true" className="rounded-lg border border-line bg-elevated/60 p-5 opacity-75" key={mode.id}>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-semibold text-slate-300">{mode.label}</h2>
                      <span className="rounded-full border border-line px-2 py-1 text-xs text-slate-500">Coming Soon</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-500">{mode.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </fieldset>

          {error && <p className="status-error mt-6 rounded border p-3 text-sm">{error}</p>}

          <div className="mt-8 flex justify-end">
            <button
              className="rounded bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              disabled={!selectedMode || loading}
              onClick={complete}
              type="button"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
