"use client";

import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { TourId, TourPlacement, TourStep } from "@/lib/tours";
import { markTourCompleted } from "@/lib/tours";

type Rect = { top: number; left: number; width: number; height: number };
type TooltipPosition = { top: number; left: number };

const CARD_WIDTH = 320;
const GAP = 16;
const PAD = 12;

export function GuidedTour({
  active,
  finalLabel = "Finish",
  onClose,
  steps,
  tourId,
  userId,
}: {
  active: boolean;
  finalLabel?: string;
  onClose: () => void;
  steps: TourStep[];
  tourId: TourId;
  userId: string | null | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [missingAttempts, setMissingAttempts] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const current = steps[index];
  const total = steps.length;
  const isFinal = index >= total - 1;

  useEffect(() => {
    if (!active) return;
    setIndex(0);
    setRect(null);
    setMissingAttempts(0);
  }, [active, tourId]);

  useEffect(() => {
    if (!active || !current?.route || current.route === pathname) return;
    router.push(current.route);
  }, [active, current?.route, pathname, router]);

  useEffect(() => {
    if (!active || !current) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeRef.current?.focus(), reduceMotion ? 0 : 120);

    function measure() {
      if (current.route && current.route !== window.location.pathname) return;
      const target = document.querySelector<HTMLElement>(current.target);
      if (!target) {
        setRect(null);
        setMissingAttempts((value) => value + 1);
        return;
      }
      target.scrollIntoView({ block: "center", inline: "center", behavior: reduceMotion ? "auto" : "smooth" });
      window.setTimeout(() => {
        const next = target.getBoundingClientRect();
        setRect({ top: next.top, left: next.left, width: next.width, height: next.height });
        setMissingAttempts(0);
      }, reduceMotion ? 0 : 180);
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, current, pathname, reduceMotion]);

  useEffect(() => {
    if (!active || rect || missingAttempts < 3) return;
    if (process.env.NODE_ENV !== "production") console.warn(`QueryRight tour target missing: ${current?.target ?? "unknown"}`);
    if (index < total - 1) {
      setIndex((value) => value + 1);
      setMissingAttempts(0);
    } else {
      finish();
    }
  }, [active, current?.target, index, missingAttempts, rect, total]);

  useEffect(() => {
    if (!active) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        skip();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        back();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  const tooltip = useMemo(() => (rect && current ? tooltipPosition(rect, current.placement ?? "auto") : null), [current, rect]);

  if (!active || !current) return null;

  function complete() {
    if (userId) markTourCompleted(userId, tourId);
    onClose();
  }

  function finish() {
    complete();
    if (tourId === "queryright_app_tour_v1") router.push("/learn");
  }

  function skip() {
    complete();
  }

  function next() {
    if (isFinal) {
      finish();
      return;
    }
    setIndex((value) => Math.min(total - 1, value + 1));
    setRect(null);
  }

  function back() {
    setIndex((value) => Math.max(0, value - 1));
    setRect(null);
  }

  return (
    <AnimatePresence>
      <motion.div
        aria-label={`${current.title}. Step ${index + 1} of ${total}.`}
        aria-live="polite"
        className="fixed inset-0 z-[80] pointer-events-none"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        role="dialog"
        transition={{ duration: reduceMotion ? 0.05 : 0.18 }}
      >
        {rect ? <Spotlight rect={rect} /> : <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]" />}
        {rect && <div aria-hidden="true" className="absolute rounded-lg border-2 border-brand shadow-[0_0_0_6px_rgb(var(--color-brand)/0.14),0_0_42px_rgb(var(--color-brand)/0.34)]" style={spotlightStyle(rect)} />}
        <motion.div
          className="pointer-events-auto fixed w-[min(320px,calc(100vw-1.5rem))] rounded-lg border border-line bg-elevated p-4 shadow-2xl shadow-black/45"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.05 : 0.2 }}
          style={tooltip ?? centeredTooltip()}
        >
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-xs uppercase tracking-wider text-brand">{index + 1} of {total}</p>
            <button ref={closeRef} aria-label="Skip tour" className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-panel hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-brand" onClick={skip} type="button">
              Skip
            </button>
          </div>
          <h2 className="mt-2 text-lg font-semibold text-slate-50">{current.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{current.description}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <button className="rounded border border-line px-3 py-2 text-sm font-semibold text-slate-300 hover:border-brand/40 hover:text-slate-50 disabled:cursor-not-allowed disabled:opacity-40" disabled={index === 0} onClick={back} type="button">
              Back
            </button>
            <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/85" onClick={next} type="button">
              {isFinal ? finalLabel : "Next"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Spotlight({ rect }: { rect: Rect }) {
  const top = Math.max(0, rect.top - PAD);
  const left = Math.max(0, rect.left - PAD);
  const right = Math.max(0, window.innerWidth - rect.left - rect.width - PAD);
  const bottom = Math.max(0, window.innerHeight - rect.top - rect.height - PAD);
  const width = rect.width + PAD * 2;
  const height = rect.height + PAD * 2;
  const panel = "absolute bg-slate-950/76 backdrop-blur-[2px]";
  return (
    <>
      <div className={panel} style={{ left: 0, top: 0, width: "100%", height: top }} />
      <div className={panel} style={{ left: 0, top, width: left, height }} />
      <div className={panel} style={{ right: 0, top, width: right, height }} />
      <div className={panel} style={{ left: 0, bottom: 0, width: "100%", height: bottom }} />
    </>
  );
}

function spotlightStyle(rect: Rect): React.CSSProperties {
  return {
    top: Math.max(PAD / 2, rect.top - PAD),
    left: Math.max(PAD / 2, rect.left - PAD),
    width: Math.min(window.innerWidth - PAD, rect.width + PAD * 2),
    height: Math.min(window.innerHeight - PAD, rect.height + PAD * 2),
  };
}

function tooltipPosition(rect: Rect, placement: TourPlacement): TooltipPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_WIDTH, vw - PAD * 2);
  const candidates: Record<Exclude<TourPlacement, "auto">, TooltipPosition> = {
    bottom: { top: rect.top + rect.height + GAP, left: rect.left + rect.width / 2 - width / 2 },
    top: { top: rect.top - GAP - 210, left: rect.left + rect.width / 2 - width / 2 },
    left: { top: rect.top + rect.height / 2 - 105, left: rect.left - width - GAP },
    right: { top: rect.top + rect.height / 2 - 105, left: rect.left + rect.width + GAP },
  };
  const order: Exclude<TourPlacement, "auto">[] = placement === "auto" ? ["bottom", "right", "left", "top"] : [placement, "bottom", "right", "left", "top"];
  for (const key of order) {
    const candidate = clampTooltip(candidates[key], width, vw, vh);
    if (candidate.top >= PAD && candidate.top <= vh - 180 - PAD) return candidate;
  }
  return centeredTooltip();
}

function clampTooltip(position: TooltipPosition, width: number, vw: number, vh: number) {
  return {
    top: Math.max(PAD, Math.min(position.top, vh - 220 - PAD)),
    left: Math.max(PAD, Math.min(position.left, vw - width - PAD)),
  };
}

function centeredTooltip(): TooltipPosition {
  return { top: Math.max(PAD, window.innerHeight / 2 - 120), left: Math.max(PAD, window.innerWidth / 2 - CARD_WIDTH / 2) };
}