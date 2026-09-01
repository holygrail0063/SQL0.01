import type { User } from "@supabase/supabase-js";
import { getProfile } from "@/lib/progress";
import { authRedirectUrl, requireSupabase } from "@/lib/supabase";

export const VERIFY_EMAIL_ROUTE = "/verify-email";

export function isEmailVerified(user: User | null | undefined): boolean {
  if (!user) return false;
  return Boolean(user.email_confirmed_at || user.confirmed_at);
}

export function verificationPath(email?: string | null, next?: string | null) {
  const params = new URLSearchParams();
  const cleanEmail = email?.trim();
  if (cleanEmail) params.set("email", cleanEmail);
  if (next) params.set("next", next);
  const query = params.toString();
  return query ? `${VERIFY_EMAIL_ROUTE}?${query}` : VERIFY_EMAIL_ROUTE;
}

export async function resendVerificationEmail(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) throw new Error("Enter your email address to resend the verification link.");

  const { error } = await requireSupabase().auth.resend({
    type: "signup",
    email: cleanEmail,
    options: {
      emailRedirectTo: authRedirectUrl("/auth/callback"),
    },
  });

  if (error) throw error;
}

export async function verifiedUserDestination(user: User, fallback = "/learn") {
  const profile = await getProfile(user);
  return profile?.onboarding_completed ? fallback : "/onboarding";
}

export function readableVerificationError(caught: unknown) {
  const message = caught instanceof Error ? caught.message : "Verification email could not be sent. Please try again.";
  if (/email.*limit|rate.*limit|over_email_send_rate_limit|too many/i.test(message)) {
    return "Please wait a moment before requesting another verification email.";
  }
  if (/already.*confirm|already.*verified|already.*registered/i.test(message)) {
    return "This email may already be verified. Try signing in to continue.";
  }
  return message;
}
