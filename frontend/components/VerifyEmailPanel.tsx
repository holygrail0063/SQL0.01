"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/lib/auth";
import { isEmailVerified, readableVerificationError, resendVerificationEmail, verifiedUserDestination } from "@/lib/email-verification";
import { safeNextPath } from "@/lib/session-boundary";

type VerifyEmailPanelProps = {
  initialEmail?: string;
  state?: "pending" | "required" | "success" | "error";
  message?: string;
  nextPath?: string | null;
};

export function VerifyEmailPanel({ initialEmail = "", state = "pending", message, nextPath }: VerifyEmailPanelProps) {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<string | null>(message ?? null);
  const [error, setError] = useState<string | null>(state === "error" ? message ?? "Verification link is invalid or expired." : null);
  const [sending, setSending] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [verifiedHref, setVerifiedHref] = useState(nextPath ?? "/learn");

  useEffect(() => {
    if (!initialEmail && user?.email) setEmail(user.email);
  }, [initialEmail, user?.email]);

  useEffect(() => {
    if (!user || !isEmailVerified(user)) return;
    let active = true;
    verifiedUserDestination(user, nextPath ?? "/learn").then((destination) => {
      if (active) setVerifiedHref(destination);
    });
    return () => {
      active = false;
    };
  }, [nextPath, user]);

  const verified = isEmailVerified(user);
  const title = useMemo(() => {
    if (state === "success" || verified) return "Email verified";
    if (state === "required") return "Please verify your email";
    if (state === "error") return "Verification link expired";
    return "Check your inbox";
  }, [state, verified]);

  const body = useMemo(() => {
    if (state === "success" || verified) return "Your QueryRight account is ready.";
    if (state === "required") return "Please verify your email before continuing. We sent a verification link to your email address.";
    if (state === "error") return "That verification link could not be used. Request a new link, then open the latest email from QueryRight.";
    return "We've sent a verification link. Verify your email to activate your QueryRight account.";
  }, [state, verified]);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);

    const now = Date.now();
    if (lastSentAt && now - lastSentAt < 30000) {
      setError("Please wait a moment before requesting another verification email.");
      return;
    }

    setSending(true);
    try {
      await resendVerificationEmail(email);
      setLastSentAt(now);
      setStatus("Verification email sent.");
    } catch (caught) {
      setError(readableVerificationError(caught));
    } finally {
      setSending(false);
    }
  }

  const continueHref = safeNextPath(nextPath ?? null) ?? "/login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-5 py-12 text-slate-50">
      <section className="w-full max-w-md rounded-lg border border-line bg-panel p-8 shadow-2xl shadow-slate-900/10">
        <div className="text-center">
          <BrandMark />
          <h1 className="mt-7 text-2xl font-semibold text-slate-50">{title}</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">{body}</p>
        </div>

        {email && !verified && (
          <div className="mt-6 rounded border border-line bg-elevated px-4 py-3 text-center text-sm text-slate-200">
            {email}
          </div>
        )}

        {!verified && (
          <form className="mt-6 space-y-4" onSubmit={resend}>
            {!email && (
              <label className="block text-sm text-slate-300">
                Email
                <input
                  autoComplete="email"
                  className="mt-2 h-11 w-full rounded border border-line bg-elevated px-3 text-base text-slate-50 focus:border-brand-strong sm:text-sm"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </label>
            )}
            {error && <p className="status-error rounded border p-3 text-sm" role="alert">{error}</p>}
            {status && <p className="status-success rounded border p-3 text-sm" role="status">{status}</p>}
            <button
              className="h-11 w-full rounded bg-brand text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700"
              disabled={sending || loading || !email}
              type="submit"
            >
              {sending ? "Sending..." : "Resend verification email"}
            </button>
          </form>
        )}

        <div className="mt-6 grid gap-3 text-center text-sm">
          {verified || state === "success" ? (
            <Link className="rounded border border-line px-4 py-3 font-semibold text-slate-100 hover:border-brand/60" href={verifiedHref}>
              Continue to QueryRight
            </Link>
          ) : (
            <Link className="text-cyan hover:text-slate-50" href={continueHref === "/login" ? "/login" : `/login?next=${encodeURIComponent(continueHref)}`}>
              Already verified? Continue to sign in
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
