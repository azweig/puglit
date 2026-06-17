import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = u.userId;
  const url = new URL(request.url);
  const latitude = parseFloat(url.searchParams.get("latitude") || "0");
  const longitude = parseFloat(url.searchParams.get("longitude") || "0");
  const radius = parseFloat(url.searchParams.get("radius") || "10"); // default radius 10 km

  // Retrieve user memberships
  const { rows: memberships } = await pool.query(
    "SELECT program_id FROM user_memberships WHERE user_id = $1",
    [userId]
  );

  if (memberships.length === 0) {
    return NextResponse.json([]);
  }

  const programIds = memberships.map((m) => m.program_id);

  // Haversine formula to find nearby branches with offers
  const { rows: offers } = await pool.query(
    `SELECT offers.id, offers.title, offers.discount_label, merchants.name AS merchant_name, branches.address,
            (6371 * acos(cos(radians($1)) * cos(radians(branches.latitude)) * cos(radians(branches.longitude) - radians($2)) + sin(radians($1)) * sin(radians(branches.latitude)))) AS distance
     FROM offers
     JOIN merchants ON offers.merchant_id = merchants.id
     JOIN branches ON branches.merchant_id = merchants.id
     WHERE offers.program_id = ANY($3)
     AND (6371 * acos(cos(radians($1)) * cos(radians(branches.latitude)) * cos(radians(branches.longitude) - radians($2)) + sin(radians($1)) * sin(radians(branches.latitude)))) < $4
     ORDER BY distance ASC`,
    [latitude, longitude, programIds, radius]
  );

  return NextResponse.json(offers);
}