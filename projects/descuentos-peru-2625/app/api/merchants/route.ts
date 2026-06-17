import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { name, category } = await request.json();
    if (!name || !category) {
      return NextResponse.json({ error: "name and category are required" }, { status: 400 });
    }

    await pool.query('INSERT INTO merchants (name, category) VALUES ($1, $2)', [name, category]);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}