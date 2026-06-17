import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { merchant_id, title, discount_label, program_id } = await request.json();

    // Verify that the user is a participant in the loyalty program
    const { rowCount } = await pool.query(
      "SELECT 1 FROM user_memberships WHERE user_id = $1 AND program_id = $2",
      [u.id, program_id]
    );

    if (rowCount === 0) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { rows } = await pool.query(
      "INSERT INTO offers (merchant_id, title, discount_label, program_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [merchant_id, title, discount_label, program_id]
    );

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}