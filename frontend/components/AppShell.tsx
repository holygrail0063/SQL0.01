"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { AnimatedPrimaryNav, MobilePrimaryNav, type PrimaryNavItem } from "@/components/AnimatedPrimaryNav";
import { BrandMark } from "@/components/BrandMark";
import { ProfileMorphMenu } from "@/components/ProfileMorphMenu";
import { useAuth } from "@/lib/auth";

const navItems: PrimaryNavItem[] = [
  { href: "/learn", label: "Learn" },
  { href: "/sql-editor", label: "SQL Editor", mobileLabel: "Editor" },
  { href: "/practice", label: "Practice" },
  { href: "/progress", label: "Progress", mobileLabel: "Prog." },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-ink pb-20 text-slate-50 md:pb-0">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="sticky top-0 z-40 border-b border-line bg-panel/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/learn">
            <BrandMark />
          </Link>
          <AnimatedPrimaryNav isActive={isActiveNav} items={navItems} pathname={pathname} />
          <ProfileMorphMenu currentPath={pathname} user={user} />
        </div>
      </header>
      <div id="main-content" tabIndex={-1}>{children}</div>
      <MobilePrimaryNav isActive={isActiveNav} items={navItems} pathname={pathname} />
    </div>
  );
}

function isActiveNav(pathname: string, href: string) {
  if (href === "/sql-editor") return pathname === href || pathname.startsWith("/learn/lesson");
  if (href === "/learn") return pathname === "/learn";
  if (href === "/practice") return pathname === href || pathname.startsWith("/challenge") || pathname.startsWith("/sqlbank");
  if (href === "/progress") return pathname === href || pathname.startsWith("/dashboard");
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  return false;
}
