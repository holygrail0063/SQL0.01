import { NextResponse } from "next/server";
import { getSchema } from "@/lib/sqlbank-server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getSchema());
}
