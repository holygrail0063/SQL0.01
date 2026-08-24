"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { dailyCommitmentOptions, getCourseForSelection, getDailyCommitment } from "@/lib/course";
import { activeRoleOptions, activeSqlLevelOptions } from "@/lib/curriculum";
import { getProfile, saveProfile, type Profile } from "@/lib/progress";
import { requireSupabase } from "@/lib/supabase";

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
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string>(activeRoleOptions[0]);
  const [level, setLevel] = useState(activeSqlLevelOptions[1].value);
  const [dailyCommitment, setDailyCommitment] = useState(30);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingPathChange, setConfirmingPathChange] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProfile(user).then((profile) => {
      setProfile(profile);
      setRole(profile?.selected_role && (activeRoleOptions as readonly string[]).includes(profile.selected_role) ? profile.selected_role : activeRoleOptions[0]);
      setLevel(profile?.sql_level && profile.sql_level !== "Interview Preparation" ? profile.sql_level : activeSqlLevelOptions[1].value);
      setDailyCommitment(getDailyCommitment(profile));
    });
  }, [user]);

  const selectedCourse = getCourseForSelection(role, level);
  const hasExistingPath = Boolean(profile?.onboarding_completed && profile.selected_role && profile.sql_level);
  const pathChanged = hasExistingPath && (profile?.selected_role !== role || profile?.sql_level !== level);

  async function requestSave() {
    if (pathChanged) {
      setConfirmingPathChange(true);
      return;
    }
    await save();
  }

  async function save() {
    if (!user) return;
    const saved = await saveProfile(user, {
      selected_role: role,
      sql_level: level,
      daily_commitment_minutes: dailyCommitment,
      onboarding_completed: true,
    });
    setProfile(saved);
    setConfirmingPathChange(false);
    setMessage(pathChanged ? "Learning path updated. Completed lessons and skill progress were preserved." : "Learning preferences saved.");
  }

  async function logout() {
    await requireSupabase().auth.signOut();
    router.replace("/");
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="font-mono text-sm text-cyan">Account</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">Learning Preferences</h1>
      <p className="mt-2 text-sm text-slate-600">Choose the SQL path and pace QueryRight should use when recommending lessons and practice.</p>
      <section className="mt-8 space-y-5 rounded border border-line bg-panel p-6">
        <label className="block text-sm text-slate-700">
          Learning Goal
          <select className="mt-2 h-11 w-full rounded border border-line bg-elevated px-3 text-slate-950 outline-none focus:border-brand" onChange={(event) => setRole(event.target.value)} value={role}>
            {activeRoleOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="block text-sm text-slate-700">
          SQL Experience
          <select className="mt-2 h-11 w-full rounded border border-line bg-elevated px-3 text-slate-950 outline-none focus:border-brand" onChange={(event) => setLevel(event.target.value)} value={level}>
            {activeSqlLevelOptions.map((option) => <option key={option.value}>{option.value}</option>)}
          </select>
        </label>
        <label className="block text-sm text-slate-700">
          Recommended Daily Commitment
          <select className="mt-2 h-11 w-full rounded border border-line bg-elevated px-3 text-slate-950 outline-none focus:border-brand" onChange={(event) => setDailyCommitment(Number(event.target.value))} value={dailyCommitment}>
            {dailyCommitmentOptions.map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
          </select>
        </label>

        {selectedCourse ? (
          <div className="rounded border border-line bg-elevated p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-cyan">Your Learning Path</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{selectedCourse.shortTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{selectedCourse.description}</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <span>{selectedCourse.estimatedWeeks}</span>
              <span>{selectedCourse.lessonCountLabel}</span>
              <span>{selectedCourse.exerciseCountLabel}</span>
              <span>{selectedCourse.projectCountLabel}</span>
              <span>{selectedCourse.capstoneCountLabel}</span>
              <span>{dailyCommitment} min/day</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedCourse.skills.slice(0, 10).map((skill) => (
                <span className="rounded border border-line bg-elevated px-2 py-1 text-xs text-slate-700" key={skill}>{skill}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded border border-line bg-elevated p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-cyan">Coming Soon</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{role}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">That career pathway is being built. You can keep this goal selected, or choose Business Analyst or Data Analyst to start a working curriculum today.</p>
          </div>
        )}
        {message && <p className="text-sm text-success">{message}</p>}
        <div className="flex flex-wrap gap-3">
          <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950" onClick={requestSave} type="button">
            {hasExistingPath ? "Update Learning Path" : "Save & Build My Learning Path"}
          </button>
          <Link className="inline-flex items-center gap-2 rounded border border-line px-4 py-2 text-sm font-semibold text-slate-800 hover:border-brand-strong/50" href="/learn">
            <BookOpen size={16} />
            Back to Learn
          </Link>
          <button className="rounded border border-line px-4 py-2 text-sm text-slate-700 hover:border-brand-strong/50" onClick={logout} type="button">Log out</button>
        </div>
      </section>

      {confirmingPathChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5">
          <section className="w-full max-w-md rounded border border-line bg-panel p-6 shadow-2xl shadow-black/40">
            <h2 className="text-xl font-semibold text-slate-950">Update learning path?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Your completed lessons and skill progress will be preserved. Your upcoming lessons will be adjusted to match:
            </p>
            <p className="mt-4 rounded border border-line bg-elevated p-3 text-sm font-semibold text-slate-950">
              {role} - {level}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded border border-line px-4 py-2 text-sm text-slate-700 hover:border-brand-strong/50" onClick={() => setConfirmingPathChange(false)} type="button">Cancel</button>
              <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950" onClick={save} type="button">Update Path</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
