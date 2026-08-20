"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" aria-label="QueryRight home">
          <BrandMark />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          <a href="/#product" className="hover:text-white">Product</a>
          <a href="/#how-it-works" className="hover:text-white">How It Works</a>
          <a href="/#paths" className="hover:text-white">Learning Paths</a>
          <a href="/#about" className="hover:text-white">About</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm text-slate-300 hover:text-white sm:block">Log in</Link>
          <Link href="/signup" className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90">
            Start Learning
          </Link>
        </div>
      </div>
    </header>
  );
}
