"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { BrandMark } from "@/components/BrandMark";
import { ProfileMorphMenu } from "@/components/ProfileMorphMenu";
import { applyAccent, applyDefaultAccent, cacheAccent, normalizeAccentId, readCachedAccent } from "@/lib/accent";
import { useAuth } from "@/lib/auth";
import { getProfile } from "@/lib/progress";

export function AppShell({ children, manageAccent = true }: { children: ReactNode; manageAccent?: boolean }) {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (!manageAccent) return;
    if (!user) {
      applyDefaultAccent();
      return;
    }

    const cachedAccent = readCachedAccent(user.id);
    if (cachedAccent) applyAccent(cachedAccent);

    let active = true;
    getProfile(user)
      .then((profile) => {
        if (!active) return;
        const accent = normalizeAccentId(profile?.accent_color);
        applyAccent(accent);
        cacheAccent(user.id, accent);
      })
      .catch(() => {
        if (active) applyDefaultAccent();
      });

    return () => {
      active = false;
    };
  }, [manageAccent, user]);

  return (
    <div className="min-h-screen bg-ink text-slate-50">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="sticky top-0 z-40 border-b border-line bg-panel/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/learn">
            <BrandMark />
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-1 rounded-xl border border-line/70 bg-ink/30 p-1">
            <Link aria-current={pathname === "/learn" ? "page" : undefined} className={primaryNavClass(pathname === "/learn")} href="/learn">
              Learn
            </Link>
            <Link aria-current={isSqlEditorActive(pathname) ? "page" : undefined} className={primaryNavClass(isSqlEditorActive(pathname))} href="/sql-editor">
              SQL Editor
            </Link>
          </nav>
          <ProfileMorphMenu currentPath={pathname} user={user} />
        </div>
      </header>
      <div id="main-content" tabIndex={-1}>{children}</div>
    </div>
  );
}

function primaryNavClass(active: boolean) {
  return `rounded-lg px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
    active ? "border border-brand/25 bg-brand/10 text-slate-50" : "text-slate-400 hover:text-slate-50"
  }`;
}

function isSqlEditorActive(pathname: string) {
  return pathname === "/sql-editor" || pathname.startsWith("/learn/lesson");
}
