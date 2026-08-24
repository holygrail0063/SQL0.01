"use client";

import type { User } from "@supabase/supabase-js";
import { applyDefaultAccent } from "@/lib/accent";
import { requireSupabase } from "@/lib/supabase";

export const DEFAULT_AUTHENTICATED_ROUTE = "/learn";

const EXPLICIT_LOGOUT_FLAG = "queryright:explicit-logout";
const AUTH_ROUTE_PREFIXES = ["/login", "/signup", "/forgot-password", "/auth/callback"];

export function markExplicitLogout() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(EXPLICIT_LOGOUT_FLAG, "1");
}

export function clearExplicitLogoutFlag() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(EXPLICIT_LOGOUT_FLAG);
}

export function isExplicitLogoutInProgress() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(EXPLICIT_LOGOUT_FLAG) === "1";
}

export function safeNextPath(value: string | null) {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;

  try {
    const parsed = new URL(value, "https://queryright.local");
    if (parsed.origin !== "https://queryright.local") return null;
    if (!parsed.pathname.startsWith("/")) return null;
    if (AUTH_ROUTE_PREFIXES.some((prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`))) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function clearSessionScopedClientState(userId?: string | null) {
  if (typeof window === "undefined") return;

  applyDefaultAccent();

  if (!userId) return;

  try {
    const keysToRemove: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && isQueryRightUserScopedKey(key, userId)) keysToRemove.push(key);
    }

    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage cleanup should not block a completed Supabase signout.
  }
}

export async function logoutToLogin(user?: Pick<User, "id"> | null) {
  markExplicitLogout();
  const { error } = await requireSupabase().auth.signOut();

  if (error) {
    clearExplicitLogoutFlag();
    throw error;
  }

  clearSessionScopedClientState(user?.id);
  window.location.replace("/login");
}

function isQueryRightUserScopedKey(key: string, userId: string) {
  return (
    key === `queryright:accent:${userId}` ||
    key.startsWith(`queryright:sql-editor:${userId}:`) ||
    key.startsWith(`queryright:lesson:${userId}:`) ||
    key.startsWith(`queryright:course:${userId}:`) ||
    key.startsWith(`queryright:workspace:${userId}:`)
  );
}
