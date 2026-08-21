import { NextResponse } from "next/server";
import { runFreeSqlBankQuery } from "@/lib/sqlbank-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { query?: string };
  const result = runFreeSqlBankQuery(String(body.query ?? ""));
  return NextResponse.json(result.body, { status: result.status });
}
