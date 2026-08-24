import { NextResponse } from "next/server";
import { listChallenges } from "@/lib/sqlbank-server";

export const dynamic = "force-dynamic";

const activeChallengeIds = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 26]);

export function GET() {
  return NextResponse.json(listChallenges().filter((challenge) => activeChallengeIds.has(challenge.id)));
}
