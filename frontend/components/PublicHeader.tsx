"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { LandingAuthTrigger } from "@/components/landing/LandingAuthTrigger";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-panel/90 backdrop-blur">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" aria-label="QueryRight home">
          <BrandMark />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
          <a href="/#product" className="hover:text-slate-50">Product</a>
          <a href="/#how-it-works" className="hover:text-slate-50">How It Works</a>
          <a href="/#paths" className="hover:text-slate-50">Learning Paths</a>
          <a href="/#about" className="hover:text-slate-50">About</a>
        </nav>
        <div className="flex items-center gap-3">
          <LandingAuthTrigger className="hidden text-sm text-slate-400 hover:text-slate-50 sm:block" mode="login" testId="landing-login-trigger">
            Log in
          </LandingAuthTrigger>
          <LandingAuthTrigger className="hidden rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate-300 hover:border-brand-strong/50 hover:text-slate-50 sm:inline-flex" mode="signup" testId="landing-signup-trigger">
            Sign Up
          </LandingAuthTrigger>
          <LandingAuthTrigger className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-brand/80" mode="signup" testId="landing-start-learning-trigger">
            Start Learning
          </LandingAuthTrigger>
        </div>
      </div>
    </header>
  );
}
