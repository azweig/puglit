import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { merchant_id, address, latitude, longitude } = await request.json();

    if (!merchant_id || !address) {
      return NextResponse.json({ error: "merchant_id and address are required" }, { status: 400 });
    }

    // Verify that the merchant exists
    const merchantCheck = await pool.query(
      'SELECT 1 FROM merchants WHERE id = $1',
      [merchant_id]
    );

    if (merchantCheck.rowCount === 0) {
      return NextResponse.json({ error: "Merchant does not exist" }, { status: 404 });
    }

    await pool.query(
      'INSERT INTO branches (merchant_id, address, latitude, longitude) VALUES ($1, $2, $3, $4)',
      [merchant_id, address, latitude, longitude]
    );

    return NextResponse.json({ message: "Branch created successfully" }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}