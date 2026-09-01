"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { VerifyEmailPanel } from "@/components/VerifyEmailPanel";
import { isEmailVerified, verifiedUserDestination } from "@/lib/email-verification";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your email...");
  const [error, setError] = useState(false);
  const [successDestination, setSuccessDestination] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setError(true);
      setMessage("Supabase is not configured for this environment.");
      return;
    }

    const client = supabase;
    let active = true;

    async function continueVerifiedUser(user: User) {
      const destination = await verifiedUserDestination(user);
      if (!active) return;
      setMessage("Your QueryRight account is ready.");
      setSuccessDestination(destination);
      window.setTimeout(() => {
        if (active) router.replace(destination);
      }, 1400);
    }

    async function finishAuthRedirect() {
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      const { data, error: sessionError } = await client.auth.getSession();

      if (!active) return;

      if (sessionError) {
        setError(true);
        setMessage("Verification link is invalid or expired.");
        return;
      }

      const user = data.session?.user;
      if (user && isEmailVerified(user)) {
        await continueVerifiedUser(user);
        return;
      }

      setError(true);
      setMessage("Confirmation could not be completed. Please request a new verification link.");
    }

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (!user || !isEmailVerified(user)) return;
      continueVerifiedUser(user);
    });

    finishAuthRedirect();

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  if (successDestination) {
    return <VerifyEmailPanel state="success" message={message} nextPath={successDestination} />;
  }

  if (error) {
    return <VerifyEmailPanel state="error" message={message} />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-5 py-12 text-slate-50">
      <section className="w-full max-w-md rounded-lg border border-line bg-panel p-8 text-center shadow-2xl shadow-slate-900/10">
        <BrandMark />
        <h1 className="mt-7 text-2xl font-semibold text-slate-50">Finishing sign in</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">{message}</p>
      </section>
    </main>
  );
}
