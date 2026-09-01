import { NextResponse } from "next/server";
import { requireVerifiedApiUser } from "@/lib/server-auth";
import { runFreeSqlBankQuery } from "@/lib/sqlbank-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireVerifiedApiUser(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as { query?: string };
  const result = runFreeSqlBankQuery(String(body.query ?? ""));
  return NextResponse.json(result.body, { status: result.status });
}
