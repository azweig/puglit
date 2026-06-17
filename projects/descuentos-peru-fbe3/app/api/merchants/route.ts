import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { name, category } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await pool.query('INSERT INTO merchants (name, category) VALUES ($1, $2)', [name, category]);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating merchant:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}