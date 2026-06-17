import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const merchantId = url.searchParams.get("merchant_id");

  if (!merchantId) {
    return NextResponse.json({ error: "merchant_id is required" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      "SELECT id, address, latitude, longitude FROM branches WHERE merchant_id=$1 ORDER BY id ASC",
      [merchantId]
    );
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}