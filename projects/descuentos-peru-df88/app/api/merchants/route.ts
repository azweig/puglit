import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { name, category } = await request.json();
    const { rows } = await pool.query(
      "INSERT INTO merchants (name, category) VALUES ($1, $2) RETURNING *",
      [name, category]
    );
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create merchant" }, { status: 500 });
  }
}