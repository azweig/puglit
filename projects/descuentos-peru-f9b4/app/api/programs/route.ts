import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { rows } = await pool.query("SELECT id, name, provider FROM programs ORDER BY name ASC");
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}