import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { rows } = await pool.query(
    "SELECT * FROM matches WHERE user_a=$1 OR user_b=$1",
    [u.userId]
  );

  return NextResponse.json(rows);
}