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

    if (!merchant_id || !title || !discount_label || !program_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the user has a membership in the program
    const membershipCheck = await pool.query(
      "SELECT 1 FROM user_memberships WHERE user_id = $1 AND program_id = $2",
      [u.id, program_id]
    );

    if (membershipCheck.rowCount === 0) {
      return NextResponse.json({ error: "User not authorized for this program" }, { status: 403 });
    }

    const { rows } = await pool.query(
      "INSERT INTO offers (merchant_id, title, discount_label, program_id) VALUES ($1, $2, $3, $4) RETURNING id",
      [merchant_id, title, discount_label, program_id]
    );

    const newOfferId = rows[0].id;

    return NextResponse.json({ id: newOfferId }, { status: 201 });
  } catch (error) {
    console.error("Error creating offer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}