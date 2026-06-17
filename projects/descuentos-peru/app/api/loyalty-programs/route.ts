import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { name, provider, membership_id, expiration_date } = await request.json();

  await pool.query(
    'INSERT INTO loyalty_programs (user_id, name, provider, membership_id, expiration_date) VALUES ($1, $2, $3, $4, $5)',
    [u.userId, name, provider, membership_id, expiration_date]
  );

  return NextResponse.json({ success: true });
}