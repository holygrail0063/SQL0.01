import type { User } from "@supabase/supabase-js";
import type { QueryResult } from "@/lib/api";
import { requireSupabase, supabase } from "@/lib/supabase";

export type Profile = {
  id?: string;
  auth_user_id: string;
  display_name: string | null;
  selected_role: string | null;
  sql_level: string | null;
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
  const { data, error } = await supabase.from("profiles").select("*").eq("auth_user_id", user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProfile(user: User, values: Partial<Profile>): Promise<Profile> {
  const client = requireSupabase();
  const profile = {
    auth_user_id: user.id,
    display_name: values.display_name ?? user.email?.split("@")[0] ?? null,
    selected_role: values.selected_role ?? null,
    sql_level: values.sql_level ?? null,
    onboarding_completed: values.onboarding_completed ?? false,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await client.from("profiles").upsert(profile, { onConflict: "auth_user_id" }).select("*").single();
  if (error) throw error;
  return data;
}

export async function getProgress(user: User): Promise<ProgressRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("user_progress").select("*").eq("user_id", user.id);
  if (error) throw error;
  return data ?? [];
}

export async function recordAttempt(user: User, challengeId: number, queryText: string, result: QueryResult) {
  const client = requireSupabase();
  const attemptedAt = new Date().toISOString();

  await client.from("challenge_attempts").insert({
    user_id: user.id,
    challenge_id: challengeId,
    query_text: queryText,
    is_correct: result.correct,
    execution_time_ms: result.executionTimeMs,
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
