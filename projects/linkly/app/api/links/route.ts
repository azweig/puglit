import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createRecord } from "@/lib/records";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const rateLimit = await pool.query('SELECT count, last_reset FROM rate_limits WHERE user_id = $1', [u.userId]);
  const currentTime = new Date();
  const resetInterval = 60 * 60 * 1000; // 1 hour in milliseconds

  if (rateLimit.rows.length > 0) {
    const { count, last_reset } = rateLimit.rows[0];
    const lastResetTime = new Date(last_reset);
    if (currentTime - lastResetTime >= resetInterval) {
      await pool.query('UPDATE rate_limits SET count = 1, last_reset = $2 WHERE user_id = $1', [u.userId, currentTime]);
    } else if (count >= 100) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    } else {
      await pool.query('UPDATE rate_limits SET count = count + 1 WHERE user_id = $1', [u.userId]);
    }
  } else {
    await pool.query('INSERT INTO rate_limits (user_id, count, last_reset) VALUES ($1, 1, $2)', [u.userId, currentTime]);
  }

  const { original_url } = await request.json();
  try {
    new globalThis.URL(original_url); // Validate URL format
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  const shortened_url = `https://link.ly/${Math.random().toString(36).substring(2, 8)}`;
  const created_at = new Date().toISOString();
  const click_count = 0;

  const link: Link = {
    original_url,
    shortened_url,
    created_at,
    click_count
  };

  await createRecord(u.userId, 'links', link);

  return NextResponse.json({ link }, { status: 201 });
}