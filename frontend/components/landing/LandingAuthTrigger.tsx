"use client";

import { ReactNode } from "react";

export type LandingAuthMode = "login" | "signup";

export function LandingAuthTrigger({
  children,
  className,
  mode,
  testId,
}: {
  children: ReactNode;
  className?: string;
  mode: LandingAuthMode;
  testId?: string;
}) {
  return (
    <button
      className={className}
      data-testid={testId}
      onClick={() => window.dispatchEvent(new CustomEvent("queryright:open-auth", { detail: { mode } }))}
      type="button"
    >
      {children}
    </button>
  );
}
