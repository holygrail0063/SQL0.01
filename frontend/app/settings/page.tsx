"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { dailyCommitmentOptions, getBusinessAnalystCourse, getDailyCommitment } from "@/lib/course";
import { roleOptions, sqlLevelOptions } from "@/lib/curriculum";
import { getProfile, saveProfile, type Profile } from "@/lib/progress";
import { requireSupabase } from "@/lib/supabase";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <SettingsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState(roleOptions[0]);
  const [level, setLevel] = useState(sqlLevelOptions[1].value);
  const [dailyCommitment, setDailyCommitment] = useState(30);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingPathChange, setConfirmingPathChange] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProfile(user).then((profile) => {
      setProfile(profile);
      setRole(profile?.selected_role ?? roleOptions[0]);
      setLevel(profile?.sql_level ?? sqlLevelOptions[1].value);
      setDailyCommitment(getDailyCommitment(profile));
    });
  }, [user]);

  const selectedCourse = role === "Business Analyst" ? getBusinessAnalystCourse(level) : null;
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
    setMessage(pathChanged ? "Learning path updated. Completed lessons and skill progress were preserved." : "Settings saved.");
  }

  async function logout() {
    await requireSupabase().auth.signOut();
    router.replace("/");
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-semibold text-white">Settings</h1>
      <section className="mt-8 space-y-5 rounded border border-line bg-panel p-6">
        <label className="block text-sm text-slate-300">
          Learning Goal
          <select className="mt-2 h-11 w-full rounded border border-line bg-[#090f1a] px-3 text-white outline-none focus:border-brand" onChange={(event) => setRole(event.target.value)} value={role}>
            {roleOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="block text-sm text-slate-300">
          SQL Experience
          <select className="mt-2 h-11 w-full rounded border border-line bg-[#090f1a] px-3 text-white outline-none focus:border-brand" onChange={(event) => setLevel(event.target.value)} value={level}>
            {sqlLevelOptions.map((option) => <option key={option.value}>{option.value}</option>)}
          </select>
        </label>
        <label className="block text-sm text-slate-300">
          Recommended Daily Commitment
          <select className="mt-2 h-11 w-full rounded border border-line bg-[#090f1a] px-3 text-white outline-none focus:border-brand" onChange={(event) => setDailyCommitment(Number(event.target.value))} value={dailyCommitment}>
            {dailyCommitmentOptions.map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
          </select>
        </label>

        {selectedCourse ? (
          <div className="rounded border border-line bg-[#0a1322] p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-cyan">Your Learning Path</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{selectedCourse.shortTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{selectedCourse.description}</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <span>{selectedCourse.estimatedWeeks}</span>
              <span>{selectedCourse.lessonCountLabel}</span>
              <span>{selectedCourse.exerciseCountLabel}</span>
              <span>{selectedCourse.projectCountLabel}</span>
              <span>{selectedCourse.capstoneCountLabel}</span>
              <span>{dailyCommitment} min/day</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedCourse.skills.slice(0, 10).map((skill) => (
                <span className="rounded border border-line bg-[#090f1a] px-2 py-1 text-xs text-slate-300" key={skill}>{skill}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded border border-line bg-[#0a1322] p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-cyan">Coming Soon</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{role}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">That career pathway is being built. You can keep this goal selected, and QueryRight will show the Business Analyst curriculum when you choose Business Analyst.</p>
          </div>
        )}
        {message && <p className="text-sm text-success">{message}</p>}
        <div className="flex flex-wrap gap-3">
          <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={requestSave} type="button">
            {hasExistingPath ? "Update Learning Path" : "Save & Build My Learning Path"}
          </button>
          <Link className="inline-flex items-center gap-2 rounded border border-line px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan/70" href="/learn">
            <BookOpen size={16} />
            Back to Learning
          </Link>
          <button className="rounded border border-line px-4 py-2 text-sm text-slate-300 hover:border-cyan/70" onClick={logout} type="button">Log out</button>
        </div>
      </section>

      {confirmingPathChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5">
          <section className="w-full max-w-md rounded border border-line bg-panel p-6 shadow-2xl shadow-black/40">
            <h2 className="text-xl font-semibold text-white">Update learning path?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Your completed lessons and skill progress will be preserved. Your upcoming lessons will be adjusted to match:
            </p>
            <p className="mt-4 rounded border border-line bg-[#090f1a] p-3 text-sm font-semibold text-white">
              {role} - {level}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded border border-line px-4 py-2 text-sm text-slate-300 hover:border-cyan/70" onClick={() => setConfirmingPathChange(false)} type="button">Cancel</button>
              <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={save} type="button">Update Path</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
