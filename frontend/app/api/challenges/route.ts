import { NextResponse } from "next/server";
import { listChallenges } from "@/lib/sqlbank-server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(listChallenges());
}
