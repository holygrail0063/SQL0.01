"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-panel/90 backdrop-blur">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" aria-label="QueryRight home">
          <BrandMark />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
          <a href="/#product" className="hover:text-slate-950">Product</a>
          <a href="/#how-it-works" className="hover:text-slate-950">How It Works</a>
          <a href="/#paths" className="hover:text-slate-950">Learning Paths</a>
          <a href="/#about" className="hover:text-slate-950">About</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm text-slate-600 hover:text-slate-950 sm:block">Log in</Link>
          <Link href="/signup" className="hidden rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-strong/50 hover:text-slate-950 sm:inline-flex">
            Sign Up
          </Link>
          <Link href="/signup" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-brand/80">
            Start Learning
          </Link>
        </div>
      </div>
    </header>
  );
}
