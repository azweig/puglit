import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const latitude = parseFloat(url.searchParams.get('latitude') || '');
  const longitude = parseFloat(url.searchParams.get('longitude') || '');

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  const { rows: programs } = await pool.query(
    'SELECT * FROM loyalty_programs WHERE user_id=$1 AND expiration_date > NOW()',
    [u.userId]
  );

  if (programs.length === 0) {
    return NextResponse.json({ error: 'no valid loyalty programs' }, { status: 400 });
  }

  const { rows: discounts } = await pool.query(
    `SELECT * FROM discounts 
     WHERE valid_until > NOW() 
     AND ST_DWithin(ST_MakePoint($1, $2)::geography, ST_MakePoint(longitude, latitude)::geography, 5000)`,
    [longitude, latitude]
  );

  return NextResponse.json({ discounts });
}
