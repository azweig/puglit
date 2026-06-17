import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { merchant_id, address, latitude, longitude } = await request.json();

    const { rows } = await pool.query(
      "INSERT INTO branches (merchant_id, address, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *",
      [merchant_id, address, latitude, longitude]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}