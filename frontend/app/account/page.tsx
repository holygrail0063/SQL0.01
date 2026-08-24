"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { getProfile, profileDisplayName, saveProfile, type Profile } from "@/lib/progress";

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <AccountContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function AccountContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getProfile(user).then((data) => {
      setProfile(data);
      setFirstName(data?.first_name ?? user.user_metadata?.first_name ?? "");
      setLastName(data?.last_name ?? user.user_metadata?.last_name ?? "");
    });
  }, [user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const saved = await saveProfile(user, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      onboarding_completed: profile?.onboarding_completed ?? true,
    });
    setProfile(saved);
    setMessage("Account updated.");
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="font-mono text-sm text-cyan">Account</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-50">{profileDisplayName(profile, user) || "Your account"}</h1>
      <p className="mt-2 text-sm text-slate-400">Manage the personal details QueryRight uses across your workspace.</p>

      <form className="mt-8 space-y-5 rounded-lg border border-line bg-panel p-6" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-slate-300">
            First Name
            <input autoComplete="given-name" className="mt-2 h-11 w-full rounded border border-line bg-elevated px-3 text-slate-50" onChange={(event) => setFirstName(event.target.value)} required value={firstName} />
          </label>
          <label className="block text-sm text-slate-300">
            Last Name
            <input autoComplete="family-name" className="mt-2 h-11 w-full rounded border border-line bg-elevated px-3 text-slate-50" onChange={(event) => setLastName(event.target.value)} required value={lastName} />
          </label>
        </div>
        <label className="block text-sm text-slate-300">
          Email
          <input autoComplete="email" className="mt-2 h-11 w-full rounded border border-line bg-slate-900 px-3 text-slate-500" disabled value={user?.email ?? ""} />
        </label>
        {message && <p className="status-success rounded border p-3 text-sm" role="status">{message}</p>}
        <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-slate-950" type="submit">Save Account</button>
      </form>
    </main>
  );
}
