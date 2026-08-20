"use client";

import Link from "next/link";
import { Chrome } from "lucide-react";
import { FormEvent, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";

type Mode = "login" | "signup" | "forgot";

export function AuthForm({ mode }: { mode: Mode }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!isSupabaseConfigured) {
      setError("Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
      return;
    }

    setLoading(true);
    try {
      const client = requireSupabase();
      if (mode === "signup") {
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const { error: signUpError } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: {
              first_name: cleanFirstName,
              last_name: cleanLastName,
              display_name: `${cleanFirstName} ${cleanLastName}`.trim(),
            },
          },
        });
        if (signUpError) throw signUpError;
        window.location.href = "/onboarding";
      } else if (mode === "login") {
        const { error: loginError } = await client.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        window.location.href = "/dashboard";
      } else {
        const { error: resetError } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (resetError) throw resetError;
        setMessage("If an account exists for that email, password reset instructions have been sent.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function continueWithGoogle() {
    setError(null);
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
      return;
    }
    const client = requireSupabase();
    await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
  }

  const title = mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back";

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-5 py-12">
      <section className="w-full max-w-md rounded border border-line bg-panel p-8 shadow-2xl shadow-black/30">
        <div className="mb-8 text-center">
          <BrandMark />
          <h1 className="mt-7 text-2xl font-semibold text-white">{title}</h1>
        </div>

        {mode !== "forgot" && (
          <>
            <button
              className="mb-6 flex h-11 w-full items-center justify-center gap-2 rounded border border-line bg-[#0c1422] text-sm font-medium text-white hover:border-cyan/70"
              onClick={continueWithGoogle}
              type="button"
            >
              <Chrome size={17} />
              Continue with Google
            </button>
            <div className="mb-6 flex items-center gap-3 text-xs text-slate-500">
              <span className="h-px flex-1 bg-line" />
              <span>or</span>
              <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        <form className="space-y-4" onSubmit={submit}>
          {mode === "signup" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">
                First Name
                <input
                  className="mt-2 h-11 w-full rounded border border-line bg-[#090f1a] px-3 text-white outline-none focus:border-brand"
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  type="text"
                  value={firstName}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Last Name
                <input
                  className="mt-2 h-11 w-full rounded border border-line bg-[#090f1a] px-3 text-white outline-none focus:border-brand"
                  onChange={(event) => setLastName(event.target.value)}
                  required
                  type="text"
                  value={lastName}
                />
              </label>
            </div>
          )}

          <label className="block text-sm text-slate-300">
            Email
            <input
              className="mt-2 h-11 w-full rounded border border-line bg-[#090f1a] px-3 text-white outline-none focus:border-brand"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          {mode !== "forgot" && (
            <label className="block text-sm text-slate-300">
              Password
              <input
                className="mt-2 h-11 w-full rounded border border-line bg-[#090f1a] px-3 text-white outline-none focus:border-brand"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
          )}

          {error && <p className="rounded border border-red-900/70 bg-red-950/40 p-3 text-sm text-red-100">{error}</p>}
          {message && <p className="rounded border border-success/40 bg-success/10 p-3 text-sm text-green-100">{message}</p>}

          <button
            className="h-11 w-full rounded bg-brand text-sm font-semibold text-white disabled:cursor-wait disabled:bg-slate-700"
            disabled={loading}
            type="submit"
          >
            {loading ? "Working..." : mode === "signup" ? "Create Account" : mode === "forgot" ? "Send Reset Link" : "Log In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {mode === "login" && (
            <>
              <Link href="/forgot-password" className="text-cyan hover:text-white">Forgot password?</Link>
              <div className="mt-4">Don&apos;t have an account? <Link className="text-cyan hover:text-white" href="/signup">Create one</Link></div>
            </>
          )}
          {mode === "signup" && <>Already have an account? <Link className="text-cyan hover:text-white" href="/login">Log in</Link></>}
          {mode === "forgot" && <Link className="text-cyan hover:text-white" href="/login">Back to login</Link>}
        </div>
      </section>
    </main>
  );
}
