"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { isExplicitLogoutInProgress } from "@/lib/session-boundary";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!configured || !user)) {
      router.replace(isExplicitLogoutInProgress() ? "/login" : `/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [configured, loading, pathname, router, user]);

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-ink text-slate-400">Loading QueryRight...</main>;
  }

  if (!configured) {
    return <main className="flex min-h-screen items-center justify-center bg-ink px-5 text-center text-slate-300">Supabase is not configured yet. Add the QueryRight Supabase environment variables to continue.</main>;
  }

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center bg-ink text-slate-400">Redirecting...</main>;
  }

  return children;
}
