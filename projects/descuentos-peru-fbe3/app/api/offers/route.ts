import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { merchant_id, title, discount_label, program_id } = await request.json();
    // Verify that the user is a participant in the program if program_id is provided
    if (program_id) {
      const { rows } = await pool.query(
        'SELECT 1 FROM user_memberships WHERE program_id = $1 AND user_id = $2',
        [program_id, u.id]
      );
      if (rows.length === 0) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }
    await pool.query(
      'INSERT INTO offers (merchant_id, title, discount_label, program_id) VALUES ($1, $2, $3, $4)',
      [merchant_id, title, discount_label, program_id]
    );
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}