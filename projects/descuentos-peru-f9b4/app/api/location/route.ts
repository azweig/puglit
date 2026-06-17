import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { latitude, longitude, address } = await request.json();

  try {
    // Corrected SQL query to match the schema
    await pool.query(
      'UPDATE users SET address = $1 WHERE id = $2',
      [address, u.userId]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'database error' }, { status: 500 });
  }
}