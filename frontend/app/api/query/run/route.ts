import { NextResponse } from "next/server";
import { runSqlBankQuery } from "@/lib/sqlbank-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { challengeId?: number; query?: string };
  const result = runSqlBankQuery(Number(body.challengeId), String(body.query ?? ""));
  return NextResponse.json(result.body, { status: result.status });
}
