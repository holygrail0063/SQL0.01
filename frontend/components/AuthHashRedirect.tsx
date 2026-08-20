"use client";

import { useEffect } from "react";

export function AuthHashRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token") && !hash.includes("refresh_token")) return;

    window.location.replace(`/auth/callback${hash}`);
  }, []);

  return null;
}
