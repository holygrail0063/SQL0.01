import { NextResponse } from "next/server";
import { requireVerifiedApiUser } from "@/lib/server-auth";
import { runFreeSqlBankQuery } from "@/lib/sqlbank-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireVerifiedApiUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // The sandbox is an authenticated, verified-user SQLBank scratchpad. It does not reveal
  // lesson answers or record progress, so the four-task learning gate belongs to /api/query/run.
  const body = (await request.json().catch(() => null)) as { query?: unknown } | null;
  const query = typeof body?.query === "string" ? body.query : "";
  const result = runFreeSqlBankQuery(query);
  return NextResponse.json(result.body, { status: result.status });
}
