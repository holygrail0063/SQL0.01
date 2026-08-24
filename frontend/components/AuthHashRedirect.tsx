"use client";

import { useEffect } from "react";
import { applyDefaultAccent } from "@/lib/accent";

export function AuthHashRedirect() {
  useEffect(() => {
    applyDefaultAccent();
    const hash = window.location.hash;
    if (!hash.includes("access_token") && !hash.includes("refresh_token")) return;

    window.location.replace(`/auth/callback${hash}`);
  }, []);

  return null;
}
