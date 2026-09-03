import { NextResponse } from "next/server";
import { requireLearningChallengeAccess } from "@/lib/course-access";
import { requireVerifiedApiUser } from "@/lib/server-auth";
import { listChallenges, runSqlBankQuery } from "@/lib/sqlbank-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireVerifiedApiUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as { challengeId?: unknown; query?: unknown } | null;
  const challengeId = Number(body?.challengeId);
  const query = typeof body?.query === "string" ? body.query : "";
  if (!Number.isInteger(challengeId) || challengeId <= 0 || typeof body?.query !== "string") {
    return NextResponse.json({ code: "INVALID_QUERY_REQUEST", error: "Provide a valid challengeId and SQL query." }, { status: 400 });
  }

  if (!listChallenges().some((challenge) => challenge.id === challengeId)) {
    return NextResponse.json({ code: "CHALLENGE_NOT_FOUND", error: "Challenge not found." }, { status: 404 });
  }

  const access = await requireLearningChallengeAccess(auth.supabase, auth.user, challengeId);
  if (!access.allowed) {
    return NextResponse.json({ code: access.code, error: access.message }, { status: 403 });
  }

  const result = runSqlBankQuery(challengeId, query);
  return NextResponse.json(result.body, { status: result.status });
}
