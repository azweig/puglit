import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { name, provider, category } = await request.json();

    if (!name || !provider || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { rows } = await pool.query(
      "INSERT INTO programs (name, provider, category) VALUES ($1, $2, $3) RETURNING id",
      [name, provider, category]
    );

    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}