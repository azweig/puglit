import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { rows } = await pool.query("SELECT id, name, provider, category FROM programs;");
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch programs." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  try {
    const body = await request.json();
    let result;

    if (action === "createMerchant") {
      const { name, category } = body;
      result = await pool.query(
        "INSERT INTO merchants (name, category) VALUES ($1, $2) RETURNING id;",
        [name, category]
      );
    } else if (action === "createBranch") {
      const { merchant_id, address, latitude, longitude } = body;
      result = await pool.query(
        "INSERT INTO branches (merchant_id, address, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id;",
        [merchant_id, address, latitude, longitude]
      );
    } else if (action === "createOffer") {
      const { merchant_id, title, discount_label, program_id } = body;
      result = await pool.query(
        "INSERT INTO offers (merchant_id, title, discount_label, program_id) VALUES ($1, $2, $3, $4) RETURNING id;",
        [merchant_id, title, discount_label, program_id]
      );
    } else {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    return NextResponse.json({ id: result.rows[0].id });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request." }, { status: 500 });
  }
}