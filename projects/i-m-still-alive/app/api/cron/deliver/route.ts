import { NextRequest, NextResponse } from "next/server";
import { runDeliveries } from "@/lib/deadman";

export async function GET(request: NextRequest) {
  const count = await runDeliveries();
  return NextResponse.json({ deliveredMessages: count });
}
