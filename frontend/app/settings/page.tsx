"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { roleOptions, sqlLevelOptions } from "@/lib/curriculum";
import { getProfile, saveProfile } from "@/lib/progress";
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
  const [role, setRole] = useState(roleOptions[0]);
  const [level, setLevel] = useState(sqlLevelOptions[1].value);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getProfile(user).then((profile) => {
      setRole(profile?.selected_role ?? roleOptions[0]);
      setLevel(profile?.sql_level ?? sqlLevelOptions[1].value);
    });
  }, [user]);

  async function save() {
    if (!user) return;
    await saveProfile(user, { selected_role: role, sql_level: level, onboarding_completed: true });
    setMessage("Settings saved.");
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
        {message && <p className="text-sm text-success">{message}</p>}
        <div className="flex flex-wrap gap-3">
          <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={save} type="button">Save Settings</button>
          <button className="rounded border border-line px-4 py-2 text-sm text-slate-300 hover:border-cyan/70" onClick={logout} type="button">Log out</button>
        </div>
      </section>
    </main>
  );
}
