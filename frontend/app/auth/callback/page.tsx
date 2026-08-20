"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your email...");

  useEffect(() => {
    if (!supabase) {
      setMessage("Supabase is not configured for this environment.");
      return;
    }

    const client = supabase;
    let active = true;

    async function finishAuthRedirect() {
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      const { data } = await client.auth.getSession();

      if (!active) return;

      if (data.session) {
        router.replace("/onboarding");
        return;
      }

      setMessage("Confirmation could not be completed. Please request a new sign-in link.");
      window.setTimeout(() => {
        if (active) router.replace("/login");
      }, 1800);
    }

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/onboarding");
    });

    finishAuthRedirect();

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-5 py-12 text-slate-100">
      <section className="w-full max-w-md rounded border border-line bg-panel p-8 text-center shadow-2xl shadow-black/30">
        <BrandMark />
        <h1 className="mt-7 text-2xl font-semibold text-white">Finishing sign in</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">{message}</p>
      </section>
    </main>
  );
}
