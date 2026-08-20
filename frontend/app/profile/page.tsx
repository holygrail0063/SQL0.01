"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { roleOptions, sqlLevelOptions } from "@/lib/curriculum";
import { getProfile, saveProfile, type Profile } from "@/lib/progress";

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
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState(roleOptions[0]);
  const [level, setLevel] = useState(sqlLevelOptions[1].value);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getProfile(user).then((data) => {
      setProfile(data);
      setDisplayName(data?.display_name ?? user.email?.split("@")[0] ?? "");
      setRole(data?.selected_role ?? roleOptions[0]);
      setLevel(data?.sql_level ?? sqlLevelOptions[1].value);
    });
  }, [user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const saved = await saveProfile(user, {
      display_name: displayName,
      selected_role: role,
      sql_level: level,
      onboarding_completed: profile?.onboarding_completed ?? true,
    });
    setProfile(saved);
    setMessage("Profile updated.");
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-semibold text-white">Profile</h1>
      <form className="mt-8 space-y-5 rounded border border-line bg-panel p-6" onSubmit={submit}>
        <label className="block text-sm text-slate-300">
          Name
          <input className="mt-2 h-11 w-full rounded border border-line bg-[#090f1a] px-3 text-white outline-none focus:border-brand" onChange={(event) => setDisplayName(event.target.value)} value={displayName} />
        </label>
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
        {message && <p className="text-sm text-success">{message}</p>}
        <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">Save Profile</button>
      </form>
    </main>
  );
}
