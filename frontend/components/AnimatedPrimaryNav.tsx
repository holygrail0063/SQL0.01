"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

export type PrimaryNavItem = {
  href: string;
  label: string;
  mobileLabel?: string;
};

type IndicatorPosition = {
  left: number;
  width: number;
  opacity: number;
};

export function AnimatedPrimaryNav({
  items,
  pathname,
  isActive,
}: {
  items: PrimaryNavItem[];
  pathname: string;
  isActive: (pathname: string, href: string) => boolean;
}) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [position, setPosition] = useState<IndicatorPosition>({ left: 0, width: 0, opacity: 0 });
  const activeIndex = useMemo(() => resolveActiveIndex(items, pathname, isActive), [isActive, items, pathname]);

  const moveToIndex = useCallback((index: number) => {
    const element = itemRefs.current[index];
    if (!element) return;

    setPosition({
      left: element.offsetLeft,
      width: element.getBoundingClientRect().width,
      opacity: 1,
    });
  }, []);

  const resetToActive = useCallback(() => {
    moveToIndex(activeIndex);
  }, [activeIndex, moveToIndex]);

  useLayoutEffect(() => {
    resetToActive();
  }, [resetToActive]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(resetToActive);
    observer.observe(container);
    itemRefs.current.forEach((item) => {
      if (item) observer.observe(item);
    });
    window.addEventListener("resize", resetToActive);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resetToActive);
    };
  }, [items, resetToActive]);

  return (
    <nav aria-label="Primary navigation" className="hidden md:block">
      <div
        className="relative flex items-center gap-1 rounded-xl border border-line/70 bg-ink/30 p-1"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) resetToActive();
        }}
        onMouseLeave={resetToActive}
        ref={containerRef}
      >
        <motion.div
          animate={position}
          aria-hidden="true"
          className="absolute bottom-1 top-1 rounded-lg border border-brand/25 bg-brand/10"
          initial={false}
          transition={reduceMotion ? { duration: 0.01 } : { type: "spring", stiffness: 450, damping: 35, mass: 0.7 }}
        />
        {items.map((item, index) => {
          const active = index === activeIndex;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`relative z-10 rounded-lg px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
                active ? "text-slate-50" : "text-slate-400 hover:text-slate-50"
              }`}
              href={item.href}
              key={item.href}
              onFocus={() => moveToIndex(index)}
              onMouseEnter={() => moveToIndex(index)}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobilePrimaryNav({
  items,
  pathname,
  isActive,
}: {
  items: PrimaryNavItem[];
  pathname: string;
  isActive: (pathname: string, href: string) => boolean;
}) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [position, setPosition] = useState<IndicatorPosition>({ left: 0, width: 0, opacity: 0 });
  const activeIndex = useMemo(() => resolveActiveIndex(items, pathname, isActive), [isActive, items, pathname]);

  const moveToIndex = useCallback((index: number) => {
    const element = itemRefs.current[index];
    if (!element) return;
    const width = Math.max(22, Math.min(42, element.getBoundingClientRect().width - 18));
    setPosition({
      left: element.offsetLeft + (element.getBoundingClientRect().width - width) / 2,
      width,
      opacity: 1,
    });
  }, []);

  const resetToActive = useCallback(() => {
    moveToIndex(activeIndex);
  }, [activeIndex, moveToIndex]);

  useLayoutEffect(() => {
    resetToActive();
  }, [resetToActive]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(resetToActive);
    observer.observe(container);
    window.addEventListener("resize", resetToActive);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resetToActive);
    };
  }, [resetToActive]);

  return (
    <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/95 px-2 py-2 shadow-2xl shadow-slate-900/10 backdrop-blur md:hidden">
      <div className="relative grid grid-cols-5" ref={containerRef}>
        <motion.div
          animate={position}
          aria-hidden="true"
          className="absolute bottom-0 h-0.5 rounded-full bg-brand"
          initial={false}
          transition={reduceMotion ? { duration: 0.01 } : { type: "spring", stiffness: 500, damping: 38, mass: 0.65 }}
        />
        {items.map((item, index) => {
          const active = index === activeIndex;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`relative rounded px-1 py-2 text-center text-xs outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${
                active ? "font-semibold text-brand" : "text-slate-400 hover:bg-elevated hover:text-slate-50"
              }`}
              href={item.href}
              key={item.href}
              onBlur={(event) => {
                if (!containerRef.current?.contains(event.relatedTarget as Node | null)) resetToActive();
              }}
              onFocus={() => moveToIndex(index)}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
            >
              {item.mobileLabel ?? item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function resolveActiveIndex(items: PrimaryNavItem[], pathname: string, isActive: (pathname: string, href: string) => boolean) {
  const activeIndex = items.findIndex((item) => isActive(pathname, item.href));
  return activeIndex >= 0 ? activeIndex : 0;
}
