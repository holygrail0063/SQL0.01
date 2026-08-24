"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { AuthForm } from "@/components/AuthForm";
import type { LandingAuthMode } from "@/components/landing/LandingAuthTrigger";

const focusableSelector = [
  "a[href]",
  "button:not([disabled]):not([tabindex='-1'])",
  "input:not([disabled]):not([type='hidden']):not([aria-hidden='true']):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function LandingAuthModal() {
  const shouldReduceMotion = useReducedMotion();
  const [mode, setMode] = useState<LandingAuthMode | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const isOpen = Boolean(mode);

  useEffect(() => {
    function openAuth(event: Event) {
      const detail = (event as CustomEvent<{ mode?: LandingAuthMode }>).detail;
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setMode(detail?.mode === "login" ? "login" : "signup");
    }

    window.addEventListener("queryright:open-auth", openAuth);
    return () => window.removeEventListener("queryright:open-auth", openAuth);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.setTimeout(() => {
      const firstInput = dialogRef.current?.querySelector<HTMLInputElement>("input:not([type='hidden']):not([aria-hidden='true']):not([tabindex='-1'])");
      firstInput?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = originalOverflow;
      returnFocusRef.current?.focus();
    };
  }, [isOpen]);

  function closeModal() {
    setMode(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function stopDialogClick(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  return (
    <AnimatePresence>
      {mode && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 text-slate-50 backdrop-blur-md sm:p-4"
          data-testid="landing-auth-modal"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={closeModal}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
        >
          <div className="absolute inset-0" data-testid="landing-auth-overlay" />
          <motion.div
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            aria-labelledby="landing-auth-title"
            aria-modal="true"
            className="relative z-10 max-h-[calc(100dvh-24px)] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-2xl border border-line bg-panel p-8 shadow-2xl shadow-black/50"
            data-testid="landing-auth-dialog"
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.97 }}
            onClick={stopDialogClick}
            onKeyDown={handleKeyDown}
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
            transition={{ duration: shouldReduceMotion ? 0.1 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              aria-label="Close authentication dialog"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-slate-400 transition-colors hover:border-brand/30 hover:text-slate-50"
              data-testid="landing-auth-close"
              onClick={closeModal}
              type="button"
            >
              <X size={18} />
            </button>
            <div id="landing-auth-title" className="sr-only">
              {mode === "login" ? "Log in" : "Create your account"}
            </div>
            <div data-testid={mode === "login" ? "landing-login-modal" : "landing-signup-modal"}>
              <AuthForm mode={mode} onModeChange={setMode} variant="modal" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
