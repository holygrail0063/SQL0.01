"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { roleOptions, sqlLevelOptions } from "@/lib/curriculum";
import { getProfile, profileDisplayName, saveProfile, type Profile } from "@/lib/progress";

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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState(roleOptions[0]);
  const [level, setLevel] = useState(sqlLevelOptions[1].value);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getProfile(user).then((data) => {
      setProfile(data);
      setFirstName(data?.first_name ?? user.user_metadata?.first_name ?? "");
      setLastName(data?.last_name ?? user.user_metadata?.last_name ?? "");
      setRole(data?.selected_role ?? roleOptions[0]);
      setLevel(data?.sql_level ?? sqlLevelOptions[1].value);
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
      onboarding_completed: profile?.onboarding_completed ?? true,
    });
    setProfile(saved);
    setMessage("Profile updated.");
  }

  const currentName = profileDisplayName(profile, user);

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-semibold text-white">Profile</h1>
      {currentName && <p className="mt-2 text-sm text-slate-400">{currentName}</p>}
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
        {message && <p className="text-sm text-success">{message}</p>}
        <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">Save Profile</button>
      </form>
    </main>
  );
}
