"use client";

import Link from "next/link";
import { BookOpen, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { dailyCommitmentOptions, getCourseForMode, getDailyCommitment } from "@/lib/course";
import { LEARNING_MODES, normalizeLearningModeId, type LearningModeId } from "@/lib/curriculum";
import { getProfile, saveProfile, type Profile } from "@/lib/progress";
import { logoutToLogin } from "@/lib/session-boundary";

export default function LearningPreferencesPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <LearningPreferencesContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function LearningPreferencesContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<LearningModeId>("completely-new");
  const [dailyCommitment, setDailyCommitment] = useState(30);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingModeChange, setConfirmingModeChange] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProfile(user).then((profile) => {
      setProfile(profile);
      setMode(normalizeLearningModeId(profile?.sql_level));
      setDailyCommitment(getDailyCommitment(profile));
    });
  }, [user]);

  const selectedCourse = getCourseForMode(mode);
  const savedMode = normalizeLearningModeId(profile?.sql_level);
  const hasExistingMode = Boolean(profile?.onboarding_completed && profile.sql_level);
  const modeChanged = hasExistingMode && savedMode !== mode;

  async function requestSave() {
    if (modeChanged) {
      setConfirmingModeChange(true);
      return;
    }
    await save();
  }

  async function save() {
    if (!user) return;
    const saved = await saveProfile(user, {
      selected_role: "",
      sql_level: mode,
      daily_commitment_minutes: dailyCommitment,
      onboarding_completed: true,
    });
    setProfile(saved);
    setConfirmingModeChange(false);
    setMessage(modeChanged ? "Learning mode updated. Completed lessons, attempts, and SQL history were preserved." : "Learning preferences saved.");
  }

  async function logout() {
    setMessage(null);
    setError(null);
    try {
      await logoutToLogin(user);
    } catch {
      setError("Could not log out. Try again.");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <p className="font-mono text-sm text-cyan">Account</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-50">Learning Preferences</h1>
      <p className="mt-2 text-sm text-slate-400">Choose how QueryRight should guide your SQL practice and recommendations.</p>
      <section className="mt-8 space-y-6 rounded-lg border border-line bg-panel p-6">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-50">Learning Mode</legend>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {LEARNING_MODES.map((option) => {
              const selected = mode === option.id;
              return (
                <label
                  className={`relative flex cursor-pointer rounded-lg border p-4 transition ${
                    selected ? "border-brand bg-brand/10 shadow-[0_0_0_1px_rgb(var(--color-brand)/0.18)]" : "border-line bg-elevated hover:border-brand/50 hover:bg-brand/5"
                  }`}
                  key={option.id}
                >
                  <input
                    checked={selected}
                    className="peer sr-only"
                    name="learning-mode"
                    onChange={() => {
                      setMode(option.id);
                      setMessage(null);
                      setError(null);
                    }}
                    type="radio"
                    value={option.id}
                  />
                  <span className="pointer-events-none absolute inset-0 rounded-lg transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-panel" />
                  <span className="flex w-full items-start justify-between gap-4">
                    <span>
                      <span className="block font-semibold text-slate-50">{option.label}</span>
                      <span className="mt-2 block text-sm leading-6 text-slate-400">{option.description}</span>
                    </span>
                    <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-brand bg-brand text-brand-foreground" : "border-line text-transparent"}`} aria-hidden="true">
                      <Check size={14} />
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="block text-sm text-slate-300">
          Recommended Daily Commitment
          <select className="mt-2 h-11 w-full rounded border border-line bg-elevated px-3 text-slate-50 outline-none focus:border-brand" onChange={(event) => setDailyCommitment(Number(event.target.value))} value={dailyCommitment}>
            {dailyCommitmentOptions.map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
          </select>
        </label>

        <div className="rounded-lg border border-line bg-elevated p-5">
          <p className="font-mono text-xs uppercase tracking-wider text-cyan">Your SQL Path</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-50">{selectedCourse.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{selectedCourse.description}</p>
          <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <span>{selectedCourse.estimatedWeeks}</span>
            <span>{selectedCourse.lessonCountLabel}</span>
            <span>{selectedCourse.exerciseCountLabel}</span>
            <span>{selectedCourse.projectCountLabel}</span>
            <span>{selectedCourse.capstoneCountLabel}</span>
            <span>{dailyCommitment} min/day</span>
          </div>
        </div>

        {message && <p className="text-sm text-success">{message}</p>}
        {error && <p className="status-error rounded border p-3 text-sm">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground" onClick={requestSave} type="button">
            {hasExistingMode ? "Update Learning Mode" : "Save Learning Mode"}
          </button>
          <Link className="inline-flex items-center gap-2 rounded border border-line px-4 py-2 text-sm font-semibold text-slate-200 hover:border-brand-strong/50" href="/learn">
            <BookOpen size={16} />
            Back to Learn
          </Link>
          <button className="rounded border border-line px-4 py-2 text-sm text-slate-300 hover:border-brand-strong/50" onClick={logout} type="button">Log out</button>
        </div>
      </section>

      {confirmingModeChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5">
          <section className="w-full max-w-md rounded-lg border border-line bg-panel p-6 shadow-2xl shadow-black/40">
            <h2 className="text-xl font-semibold text-slate-50">Update learning mode?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              QueryRight will recommend different upcoming lessons for this mode. Your completed lessons, attempts, SQL history, and analytics will stay saved.
            </p>
            <p className="mt-4 rounded border border-line bg-elevated p-3 text-sm font-semibold text-slate-50">
              {selectedCourse.shortTitle}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded border border-line px-4 py-2 text-sm text-slate-300 hover:border-brand-strong/50" onClick={() => setConfirmingModeChange(false)} type="button">Cancel</button>
              <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground" onClick={save} type="button">Update Mode</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
