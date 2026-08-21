"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { courseCompletionPercent, deriveSkillMastery, getCourseForProfile, getDailyCommitment, readinessScore, weeklyProgress } from "@/lib/course";
import { roleOptions, sqlLevelOptions } from "@/lib/curriculum";
import { getProgress, getProfile, profileDisplayName, saveProfile, type Profile, type ProgressRow } from "@/lib/progress";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ProfileContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState(roleOptions[0]);
  const [level, setLevel] = useState(sqlLevelOptions[1].value);
  const [dailyCommitment, setDailyCommitment] = useState(30);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getProfile(user), getProgress(user)]).then(([data, progressData]) => {
      setProfile(data);
      setProgress(progressData);
      setFirstName(data?.first_name ?? user.user_metadata?.first_name ?? "");
      setLastName(data?.last_name ?? user.user_metadata?.last_name ?? "");
      setRole(data?.selected_role ?? roleOptions[0]);
      setLevel(data?.sql_level ?? sqlLevelOptions[1].value);
      setDailyCommitment(getDailyCommitment(data));
    });
  }, [user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const saved = await saveProfile(user, {
      first_name: firstName,
      last_name: lastName,
      selected_role: role,
      sql_level: level,
      daily_commitment_minutes: dailyCommitment,
      onboarding_completed: profile?.onboarding_completed ?? true,
    });
    setProfile(saved);
    setMessage("Profile updated.");
  }

  const currentName = profileDisplayName(profile, user);
  const course = getCourseForProfile(profile);
  const mastery = course ? deriveSkillMastery(course, progress) : [];
  const strongest = mastery.filter((skill) => skill.mastery > 0).sort((a, b) => b.mastery - a.mastery).slice(0, 3);
  const needsWork = mastery.sort((a, b) => a.mastery - b.mastery).slice(0, 3);
  const weekly = weeklyProgress(progress);
  const readiness = course ? readinessScore(course, progress) : 0;
  const completion = course ? courseCompletionPercent(course, progress) : 0;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-semibold text-white">Profile</h1>
      {currentName && <p className="mt-2 text-sm text-slate-400">{currentName}</p>}
      <section className="mt-8 rounded border border-line bg-panel p-6">
        <p className="font-mono text-sm text-cyan">Business Analyst SQL</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Current Level", profile?.sql_level ?? "Not set"],
            ["Readiness", `${readiness}%`],
            ["Course Progress", `${completion}%`],
            ["Lessons Completed", String(weekly.lessonsCompleted)],
            ["SQLBank Assignments", String(weekly.assignments)],
            ["Queries Executed", String(progress.reduce((sum, row) => sum + row.attempt_count, 0))],
            ["Current Streak", `${weekly.currentStreak} days`],
            ["Daily Commitment", `${getDailyCommitment(profile)} minutes`],
            ["Projects Completed", `${progress.some((row) => row.challenge_id === 15 && row.status === "completed") ? 1 : 0} / 1`],
          ].map(([label, value]) => (
            <div className="rounded border border-line bg-[#090f1a] p-4" key={label}>
              <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-2 text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold text-white">Strongest skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(strongest.length ? strongest : [{ skill: "Start your first lesson", mastery: 0 }]).map((skill) => (
                <span className="rounded border border-line px-2 py-1 text-xs text-slate-300" key={skill.skill}>{skill.skill}</span>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Needs improvement</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {needsWork.map((skill) => (
                <span className="rounded border border-line px-2 py-1 text-xs text-slate-300" key={skill.skill}>{skill.skill}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
      <form className="mt-8 space-y-5 rounded border border-line bg-panel p-6" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-slate-300">
            First Name
            <input className="mt-2 h-11 w-full rounded border border-line bg-[#090f1a] px-3 text-white outline-none focus:border-brand" onChange={(event) => setFirstName(event.target.value)} required value={firstName} />
          </label>
          <label className="block text-sm text-slate-300">
            Last Name
            <input className="mt-2 h-11 w-full rounded border border-line bg-[#090f1a] px-3 text-white outline-none focus:border-brand" onChange={(event) => setLastName(event.target.value)} required value={lastName} />
          </label>
        </div>
        <label className="block text-sm text-slate-300">
          Email
          <input className="mt-2 h-11 w-full rounded border border-line bg-[#090f1a] px-3 text-slate-500" disabled value={user?.email ?? ""} />
        </label>
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
            {[15, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
          </select>
        </label>
        {message && <p className="text-sm text-success">{message}</p>}
        <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">Save Profile</button>
      </form>
    </main>
  );
}
