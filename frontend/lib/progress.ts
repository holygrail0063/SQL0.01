import type { User } from "@supabase/supabase-js";
import { normalizeAccentId, type AccentId } from "@/lib/accent";
import type { QueryResult } from "@/lib/api";
import { requireSupabase, supabase } from "@/lib/supabase";

export type Profile = {
  id?: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  selected_role: string | null;
  sql_level: string | null;
  daily_commitment_minutes: number | null;
  accent_color: AccentId | string | null;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProgressRow = {
  id?: string;
  user_id: string;
  challenge_id: number;
  status: "not_started" | "in_progress" | "completed";
  attempt_count: number;
  first_started_at?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
};

export async function getProfile(user: User): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProfile(user: User, values: Partial<Profile>): Promise<Profile> {
  const client = requireSupabase();
  const { data: existing, error: existingError } = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (existingError) throw existingError;

  const metadataNames = namesFromMetadata(user);
  const firstName = cleanName(values.first_name) ?? existing?.first_name ?? metadataNames.firstName;
  const lastName = cleanName(values.last_name) ?? existing?.last_name ?? metadataNames.lastName;
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || cleanName(values.display_name) || existing?.display_name || metadataNames.displayName || user.email?.split("@")[0] || null;

  const profile = {
    id: user.id,
    first_name: firstName,
    last_name: lastName,
    display_name: displayName,
    selected_role: values.selected_role ?? existing?.selected_role ?? null,
    sql_level: values.sql_level ?? existing?.sql_level ?? null,
    daily_commitment_minutes: values.daily_commitment_minutes ?? existing?.daily_commitment_minutes ?? 30,
    accent_color: normalizeAccentId(values.accent_color ?? existing?.accent_color),
    onboarding_completed: values.onboarding_completed ?? existing?.onboarding_completed ?? false,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await client.from("profiles").upsert(profile, { onConflict: "id" }).select("*").single();
  if (error && isMissingProfileColumnError(error)) {
    if ("accent_color" in values) throw error;
    const fallbackProfile = {
      id: user.id,
      display_name: displayName,
      selected_role: profile.selected_role,
      sql_level: profile.sql_level,
      onboarding_completed: profile.onboarding_completed,
      updated_at: profile.updated_at,
    };
    const { data: fallbackData, error: fallbackError } = await client.from("profiles").upsert(fallbackProfile, { onConflict: "id" }).select("*").single();
    if (fallbackError) throw fallbackError;
    return { ...fallbackData, first_name: firstName, last_name: lastName, accent_color: normalizeAccentId(existing?.accent_color) };
  }
  if (error) throw error;
  return data;
}

export async function saveAccentColor(user: User, accentColor: unknown): Promise<AccentId> {
  const client = requireSupabase();
  const accent = normalizeAccentId(accentColor);
  const updatedAt = new Date().toISOString();

  const { data, error } = await client
    .from("profiles")
    .update({ accent_color: accent, updated_at: updatedAt })
    .eq("id", user.id)
    .select("accent_color")
    .maybeSingle();

  if (error) throw error;
  if (data) return normalizeAccentId(data.accent_color);

  const metadataNames = namesFromMetadata(user);
  const displayName = metadataNames.displayName || user.email?.split("@")[0] || null;
  const { data: inserted, error: insertError } = await client
    .from("profiles")
    .insert({
      id: user.id,
      first_name: metadataNames.firstName,
      last_name: metadataNames.lastName,
      display_name: displayName,
      accent_color: accent,
      onboarding_completed: false,
      updated_at: updatedAt,
    })
    .select("accent_color")
    .single();

  if (insertError) throw insertError;
  return normalizeAccentId(inserted.accent_color);
}

export function profileDisplayName(profile: Profile | null, user?: User | null): string {
  const profileName = [cleanName(profile?.first_name), cleanName(profile?.last_name)].filter(Boolean).join(" ");
  if (profileName) return profileName;
  if (profile?.display_name) return profile.display_name;
  if (!user) return "";
  const metadataNames = namesFromMetadata(user);
  return metadataNames.displayName || user.email?.split("@")[0] || "";
}

function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function namesFromMetadata(user: User) {
  const metadata = user.user_metadata as Record<string, unknown>;
  const firstName = cleanName(metadata.first_name) ?? cleanName(metadata.given_name);
  const lastName = cleanName(metadata.last_name) ?? cleanName(metadata.family_name);
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || cleanName(metadata.display_name) || cleanName(metadata.full_name) || cleanName(metadata.name);
  return { firstName, lastName, displayName };
}

function isMissingProfileNameColumnError(error: unknown): boolean {
  return isMissingProfileColumnError(error);
}

function isMissingProfileColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: unknown; message?: unknown };
  return maybeError.code === "PGRST204" && typeof maybeError.message === "string" && /first_name|last_name|daily_commitment_minutes|accent_color/.test(maybeError.message);
}

export async function getProgress(user: User): Promise<ProgressRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("user_progress").select("*").eq("user_id", user.id);
  if (error) throw error;
  return data ?? [];
}

export async function recordAttempt(user: User, challengeId: number, _queryText: string, result: QueryResult) {
  const client = requireSupabase();
  const attemptedAt = new Date().toISOString();

  await client.from("challenge_attempts").insert({
    user_id: user.id,
    challenge_id: challengeId,
    is_correct: result.correct,
    attempted_at: attemptedAt,
  });

  const { data: existing, error: existingError } = await client
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .maybeSingle();
  if (existingError) throw existingError;

  const alreadyCompleted = existing?.status === "completed";
  const nextStatus = result.correct || alreadyCompleted ? "completed" : "in_progress";
  const completedAt = result.correct && !alreadyCompleted ? attemptedAt : existing?.completed_at ?? null;

  const { error } = await client.from("user_progress").upsert(
    {
      user_id: user.id,
      challenge_id: challengeId,
      status: nextStatus,
      attempt_count: (existing?.attempt_count ?? 0) + 1,
      first_started_at: existing?.first_started_at ?? attemptedAt,
      completed_at: completedAt,
      updated_at: attemptedAt,
    },
    { onConflict: "user_id,challenge_id" },
  );
  if (error) throw error;
}
