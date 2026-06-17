import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { rows: memberships } = await pool.query(
    'SELECT program_id FROM user_memberships WHERE user_id = $1',
    [u.userId]
  );

  if (memberships.length === 0) {
    return NextResponse.json({ offers: [] });
  }

  const { rows: userLocation } = await pool.query(
    'SELECT latitude, longitude FROM users WHERE id = $1',
    [u.userId]
  );

  if (userLocation.length === 0) {
    return NextResponse.json({ error: 'user location not found' }, { status: 404 });
  }

  const { latitude, longitude } = userLocation[0];

  const { rows: offers } = await pool.query(
    `SELECT o.id, o.title, o.discount_label, b.address, b.latitude, b.longitude, p.name AS program_name,
    (6371 * acos(cos(radians($1)) * cos(radians(b.latitude)) * cos(radians(b.longitude) - radians($2)) +
    sin(radians($1)) * sin(radians(b.latitude)))) AS distance
    FROM offers o
    JOIN branches b ON o.merchant_id = b.merchant_id
    JOIN programs p ON o.program_id = p.id
    WHERE o.program_id = ANY($3::BIGINT[])
    ORDER BY distance ASC
    LIMIT 10`,
    [latitude, longitude, memberships.map(m => m.program_id)]
  );

  return NextResponse.json({ offers });
}