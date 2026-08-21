"use client";

import Link from "next/link";
import Script from "next/script";
import { FormEvent, useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { authRedirectUrl, isSupabaseConfigured, requireSupabase } from "@/lib/supabase";

type Mode = "login" | "signup" | "forgot";

export function AuthForm({ mode }: { mode: Mode }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function updateCaptcha(event: Event) {
      setCaptchaToken(String((event as CustomEvent<string>).detail ?? ""));
    }

    window.addEventListener("queryright-captcha", updateCaptcha);
    return () => window.removeEventListener("queryright-captcha", updateCaptcha);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (website) {
      setError("Authentication failed. Please try again.");
      return;
    }

    if (!isSupabaseConfigured) {
      setError("Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
      return;
    }

    if (captchaRequired && !captchaToken) {
      setError("Please complete the security check.");
      return;
    }

    if (mode === "signup") {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
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
            emailRedirectTo: authRedirectUrl("/auth/callback"),
            captchaToken: captchaToken || undefined,
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
        const { error: loginError } = await client.auth.signInWithPassword({
          email,
          password,
          options: { captchaToken: captchaToken || undefined },
        });
        if (loginError) throw loginError;
        window.location.href = "/dashboard";
      } else {
        const { error: resetError } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: authRedirectUrl("/login"),
          captchaToken: captchaToken || undefined,
        });
        if (resetError) throw resetError;
        setMessage("If an account exists for that email, password reset instructions have been sent.");
      }
    } catch (caught) {
      setError(readableAuthError(caught));
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back";
  const passwordChecks = getPasswordChecks(password);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-5 py-12">
      {captchaRequired && (
        <Script src="https://js.hcaptcha.com/1/api.js" strategy="afterInteractive" />
      )}
      <section className="w-full max-w-md rounded border border-line bg-panel p-8 shadow-2xl shadow-black/30">
        <div className="mb-8 text-center">
          <BrandMark />
          <h1 className="mt-7 text-2xl font-semibold text-white">{title}</h1>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <input
            aria-hidden="true"
            autoComplete="off"
            className="hidden"
            onChange={(event) => setWebsite(event.target.value)}
            tabIndex={-1}
            type="text"
            value={website}
          />

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
                minLength={mode === "signup" ? 10 : 6}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
          )}

          {mode === "signup" && (
            <>
              <label className="block text-sm text-slate-300">
                Confirm Password
                <input
                  className="mt-2 h-11 w-full rounded border border-line bg-[#090f1a] px-3 text-white outline-none focus:border-brand"
                  minLength={10}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  type="password"
                  value={confirmPassword}
                />
              </label>
              <ul className="grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
                {passwordChecks.map((check) => (
                  <li className={check.valid ? "text-success" : "text-slate-500"} key={check.label}>
                    {check.valid ? "[ok]" : "[ ]"} {check.label}
                  </li>
                ))}
              </ul>
            </>
          )}

          {captchaRequired && (
            <div
              className="h-captcha"
              data-callback="onQueryRightCaptcha"
              data-expired-callback="onQueryRightCaptchaExpired"
              data-sitekey={captchaSiteKey}
            />
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
          <div className="mt-4">
            <Link className="text-slate-500 hover:text-white" href="/">Back to home page</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

const captchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
const captchaRequired = Boolean(captchaSiteKey);

if (typeof window !== "undefined") {
  window.onQueryRightCaptchaExpired = () => {
    window.dispatchEvent(new CustomEvent("queryright-captcha", { detail: "" }));
  };
  window.onQueryRightCaptcha = (token: string) => {
    window.dispatchEvent(new CustomEvent("queryright-captcha", { detail: token }));
  };
}

function validatePassword(value: string): string | null {
  const failed = getPasswordChecks(value).filter((check) => !check.valid);
  return failed.length ? "Password must include at least 10 characters, uppercase and lowercase letters, a number, and a symbol." : null;
}

function getPasswordChecks(value: string) {
  return [
    { label: "10+ characters", valid: value.length >= 10 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(value) },
    { label: "Lowercase letter", valid: /[a-z]/.test(value) },
    { label: "Number", valid: /\d/.test(value) },
    { label: "Symbol", valid: /[^A-Za-z0-9]/.test(value) },
  ];
}

function readableAuthError(caught: unknown) {
  const message = caught instanceof Error ? caught.message : "Authentication failed. Please try again.";
  if (/email.*limit|rate.*limit|over_email_send_rate_limit/i.test(message)) {
    return "Supabase has temporarily rate-limited confirmation emails for this project. Try again later, use another email for now, or configure custom SMTP in Supabase Auth to raise the email sending limit.";
  }
  return message;
}

declare global {
  interface Window {
    onQueryRightCaptcha?: (token: string) => void;
    onQueryRightCaptchaExpired?: () => void;
  }
}
