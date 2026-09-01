import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isSupportTopic } from "@/lib/support-topics";

const MAX_SUBJECT_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 5000;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Please log in before sending a support request." }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Support requests are not configured yet." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as {
    topic?: unknown;
    subject?: unknown;
    message?: unknown;
    pagePath?: unknown;
  } | null;

  const topic = body?.topic;
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const pagePath = typeof body?.pagePath === "string" ? body.pagePath.slice(0, 300) : null;

  if (!isSupportTopic(topic)) return NextResponse.json({ error: "Choose a support topic." }, { status: 400 });
  if (!subject) return NextResponse.json({ error: "Add a subject." }, { status: 400 });
  if (subject.length > MAX_SUBJECT_LENGTH) return NextResponse.json({ error: "Keep the subject under 120 characters." }, { status: 400 });
  if (!message) return NextResponse.json({ error: "Add a message." }, { status: 400 });
  if (message.length > MAX_MESSAGE_LENGTH) return NextResponse.json({ error: "Keep the message under 5000 characters." }, { status: 400 });

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  const user = authData.user;
  if (authError || !user) return NextResponse.json({ error: "Please log in before sending a support request." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name,last_name,display_name,sql_level")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profileDisplayName(profile, user.email);

  const { data, error } = await supabase
    .from("support_requests")
    .insert({
      user_id: user.id,
      email: user.email ?? "",
      display_name: displayName,
      topic,
      subject,
      message,
      page_path: pagePath,
      user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
      learning_mode: typeof profile?.sql_level === "string" ? profile.sql_level : null,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "We couldn't send your message. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}

function profileDisplayName(
  profile: { first_name?: unknown; last_name?: unknown; display_name?: unknown } | null,
  email?: string,
) {
  const firstName = cleanText(profile?.first_name);
  const lastName = cleanText(profile?.last_name);
  return [firstName, lastName].filter(Boolean).join(" ") || cleanText(profile?.display_name) || email?.split("@")[0] || null;
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
