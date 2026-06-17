import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { latitude, longitude } = u.profile.location;
  if (latitude === undefined || longitude === undefined) {
    return NextResponse.json({ error: 'location not set in profile' }, { status: 400 });
  }

  const membershipsResult = await pool.query(
    'SELECT program_id FROM user_memberships WHERE user_id=$1',
    [u.userId]
  );
  const memberships = membershipsResult.rows.map(r => r.program_id);

  if (memberships.length === 0) {
    return NextResponse.json({ discounts: [] });
  }

  const { rows } = await pool.query(
    `SELECT 
      offers.title, 
      offers.discount_label, 
      branches.address, 
      branches.latitude, 
      branches.longitude, 
      programs.name AS program_name, 
      (6371 * acos(cos(radians($1)) * cos(radians(branches.latitude)) * 
      cos(radians(branches.longitude) - radians($2)) + 
      sin(radians($1)) * sin(radians(branches.latitude)))) AS distance_km 
    FROM offers 
    JOIN branches ON offers.merchant_id = branches.merchant_id 
    JOIN programs ON offers.program_id = programs.id 
    WHERE offers.program_id = ANY($3) 
    AND (6371 * acos(cos(radians($1)) * cos(radians(branches.latitude)) * 
      cos(radians(branches.longitude) - radians($2)) + 
      sin(radians($1)) * sin(radians(branches.latitude)))) < $4 
    ORDER BY distance_km ASC`,
    [latitude, longitude, memberships, 5]
  );

  return NextResponse.json({ discounts: rows });
}