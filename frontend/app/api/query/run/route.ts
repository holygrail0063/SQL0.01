import { NextResponse } from "next/server";
import { requireVerifiedApiUser } from "@/lib/server-auth";
import { runSqlBankQuery } from "@/lib/sqlbank-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireVerifiedApiUser(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as { challengeId?: number; query?: string };
  const result = runSqlBankQuery(Number(body.challengeId), String(body.query ?? ""));
  return NextResponse.json(result.body, { status: result.status });
}
