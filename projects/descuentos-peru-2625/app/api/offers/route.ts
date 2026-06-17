import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import type { JWTPayload } from "jsonwebtoken"; // Assuming this is the correct import for JWTPayload

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { merchant_id, title, discount_label, program_id } = await request.json();

    // Validate input
    if (!merchant_id || !title || !discount_label || !program_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the user is a participant in the program
    const { rowCount } = await pool.query(
      'SELECT 1 FROM user_memberships WHERE program_id = $1 AND user_id = $2',
      [program_id, (u as JWTPayload).id] // Type assertion to access 'id'
    );
    if (rowCount === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Insert the new offer into the database
    await pool.query(
      'INSERT INTO offers (merchant_id, title, discount_label, program_id) VALUES ($1, $2, $3, $4)',
      [merchant_id, title, discount_label, program_id]
    );

    return NextResponse.json({ message: "Offer created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating offer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
