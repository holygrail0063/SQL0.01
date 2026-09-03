"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { ProfileMorphMenu } from "@/components/ProfileMorphMenu";
import { GuidedTour } from "@/components/tour/GuidedTour";
import { applyAccent, applyDefaultAccent, cacheAccent, normalizeAccentId, readCachedAccent } from "@/lib/accent";
import { useAuth } from "@/lib/auth";
import { getProfile } from "@/lib/progress";
import { APP_TOUR_ID, appTourSteps, consumePendingTour, isTourCompleted, type TourId } from "@/lib/tours";

const navItems = [
  { href: "/learn", label: "Learn", tour: "nav-learn" },
  { href: "/sql-editor", label: "SQL Space", tour: "nav-sql-space" },
  { href: "/progress", label: "Dashboard", tour: "nav-dashboard" },
  { href: "/practice", label: "SQLBank", tour: "nav-sqlbank" },
];

export function AppShell({ children, manageAccent = true }: { children: ReactNode; manageAccent?: boolean }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [appTourActive, setAppTourActive] = useState(false);

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
        if (profile?.onboarding_completed && !isTourCompleted(user.id, APP_TOUR_ID)) setAppTourActive(true);
      })
      .catch(() => {
        if (active) applyDefaultAccent();
      });

    return () => {
      active = false;
    };
  }, [manageAccent, user]);

  useEffect(() => {
    if (!user) return;
    if (consumePendingTour(user.id, APP_TOUR_ID)) setAppTourActive(true);

    function handleTourRequest(event: Event) {
      const detail = (event as CustomEvent<{ tourId?: TourId }>).detail;
      if (detail?.tourId === APP_TOUR_ID) setAppTourActive(true);
    }

    window.addEventListener("queryright:start-tour", handleTourRequest);
    return () => window.removeEventListener("queryright:start-tour", handleTourRequest);
  }, [user]);

  return (
    <div className="min-h-screen bg-ink text-slate-50">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="sticky top-0 z-40 border-b border-line bg-panel/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <Link href="/learn">
            <BrandMark />
          </Link>
          <nav aria-label="Primary navigation" className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-line/70 bg-ink/30 p-1">
            {navItems.map((item) => (
              <Link
                aria-current={isActiveNav(pathname, item.href) ? "page" : undefined}
                className={primaryNavClass(isActiveNav(pathname, item.href))}
                data-tour={item.tour}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ProfileMorphMenu currentPath={pathname} user={user} />
        </div>
      </header>
      <div id="main-content" tabIndex={-1}>{children}</div>
      <GuidedTour active={appTourActive} finalLabel="Start Learning" onClose={() => setAppTourActive(false)} steps={appTourSteps} tourId={APP_TOUR_ID} userId={user?.id} />
    </div>
  );
}

function primaryNavClass(active: boolean) {
  return `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
    active ? "border border-brand/25 bg-brand/10 text-slate-50" : "text-slate-400 hover:text-slate-50"
  }`;
}

function isActiveNav(pathname: string, href: string) {
  if (href === "/sql-editor") return pathname === "/sql-editor" || pathname === "/sql-space" || pathname.startsWith("/learn/lesson");
  if (href === "/progress") return pathname === "/progress" || pathname === "/dashboard";
  if (href === "/practice") return pathname === "/practice" || pathname === "/sqlbank" || pathname.startsWith("/practice/") || pathname.startsWith("/sqlbank/");
  return pathname === href;
}