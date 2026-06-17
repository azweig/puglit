import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "listPrograms") {
    const { rows } = await pool.query("SELECT id, name, provider FROM programs;");
    return NextResponse.json(rows);
  }

  if (action === "nearbyDiscounts") {
    const u = await getAuthUser(request);
    if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const latitude = parseFloat(url.searchParams.get("latitude") || "0");
    const longitude = parseFloat(url.searchParams.get("longitude") || "0");

    const { rows } = await pool.query(
      `SELECT b.id, m.name, o.title, o.discount_label, b.latitude, b.longitude, 
      (6371 * acos(cos(radians($1)) * cos(radians(b.latitude)) * 
      cos(radians(b.longitude) - radians($2)) + 
      sin(radians($1)) * sin(radians(b.latitude)))) AS distance 
      FROM branches b 
      JOIN offers o ON b.merchant_id = o.merchant_id 
      JOIN user_memberships um ON o.program_id = um.program_id 
      JOIN merchants m ON b.merchant_id = m.id
      WHERE um.user_id = $3 AND um.expiration_date > NOW() 
      ORDER BY distance ASC;`,
      [latitude, longitude, u.userId]
    );
    return NextResponse.json(rows);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const body = await request.json();

  if (action === "saveLocation") {
    const u = await getAuthUser(request);
    if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { location } = body;
    // Assuming location is a valid column in users table, otherwise this needs to be removed or corrected.
    await pool.query("UPDATE users SET location = $1 WHERE id = $2;", [location, u.userId]);
    return NextResponse.json({ success: true });
  }

  if (action === "createMerchant") {
    const { name, category } = body;
    await pool.query("INSERT INTO merchants (name, category) VALUES ($1, $2);", [name, category]);
    return NextResponse.json({ success: true });
  }

  if (action === "createBranch") {
    const { merchantId, address, latitude, longitude } = body;
    await pool.query(
      "INSERT INTO branches (merchant_id, address, latitude, longitude) VALUES ($1, $2, $3, $4);",
      [merchantId, address, latitude, longitude]
    );
    return NextResponse.json({ success: true });
  }

  if (action === "createOffer") {
    const { merchantId, title, discountLabel, programId } = body;
    await pool.query(
      "INSERT INTO offers (merchant_id, title, discount_label, program_id) VALUES ($1, $2, $3, $4);",
      [merchantId, title, discountLabel, programId]
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
