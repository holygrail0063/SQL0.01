"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { BrandMark } from "@/components/BrandMark";
import { requireSupabase } from "@/lib/supabase";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sql-space", label: "SQL Space" },
  { href: "/learn", label: "Learn" },
  { href: "/sqlbank", label: "SQLBank" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await requireSupabase().auth.signOut();
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <header className="border-b border-line bg-[#0a0f19]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/sql-space">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Link
                className={isActiveNav(pathname, item.href) ? "rounded bg-brand/15 px-3 py-2 text-sm text-white" : "rounded px-3 py-2 text-sm text-slate-400 hover:bg-panel hover:text-white"}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button className="rounded border border-line px-3 py-2 text-sm text-slate-300 hover:border-cyan/60 hover:text-white" onClick={logout} type="button">
            Log out
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

function isActiveNav(pathname: string, href: string) {
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  if (href === "/sqlbank") return pathname.startsWith("/challenge");
  if (href === "/learn") return pathname.startsWith("/learn/lesson");
  return false;
}
