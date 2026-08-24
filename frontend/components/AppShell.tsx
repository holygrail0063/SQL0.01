"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { BrandMark } from "@/components/BrandMark";
import { ProfileMorphMenu } from "@/components/ProfileMorphMenu";
import { useAuth } from "@/lib/auth";

const navItems = [
  { href: "/sql-space", label: "SQL Space" },
  { href: "/learn", label: "Learn" },
  { href: "/sql-editor", label: "SQL Editor" },
  { href: "/practice", label: "Practice" },
  { href: "/progress", label: "Progress" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-ink pb-20 text-slate-50 md:pb-0">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="sticky top-0 z-40 border-b border-line bg-panel/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/sql-space">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Link
                className={isActiveNav(pathname, item.href) ? "rounded-full border border-brand/30 bg-brand/10 px-3 py-2 text-sm font-semibold text-brand" : "rounded-full px-3 py-2 text-sm text-slate-400 hover:bg-elevated hover:text-slate-50"}
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
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-panel/95 px-2 py-2 shadow-2xl shadow-slate-900/10 backdrop-blur md:hidden">
        {navItems.map((item) => (
          <Link
            className={isActiveNav(pathname, item.href) ? "rounded border border-brand/30 bg-brand/10 px-1 py-2 text-center text-xs font-semibold text-brand" : "rounded px-1 py-2 text-center text-xs text-slate-400 hover:bg-elevated"}
            href={item.href}
            key={item.href}
          >
            {item.label === "SQL Space" ? "Space" : item.label === "SQL Editor" ? "Editor" : item.label === "Progress" ? "Prog." : item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function isActiveNav(pathname: string, href: string) {
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  if (href === "/practice") return pathname.startsWith("/challenge") || pathname.startsWith("/sqlbank");
  if (href === "/sql-editor") return pathname.startsWith("/learn/lesson");
  if (href === "/learn") return pathname === "/learn";
  if (href === "/progress") return pathname.startsWith("/dashboard");
  return false;
}
