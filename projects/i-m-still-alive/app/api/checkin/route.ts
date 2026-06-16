import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { listRecords, createRecord } from "@/lib/records";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { silence_days } = await request.json();
  const now = new Date().toISOString();

  const records = await listRecords(u.userId, "_deadman");
  if (records.length === 0) {
    await createRecord(u.userId, "_deadman", { last_check_in: now, silence_days: silence_days || 7, delivered_ids: [] });
  } else {
    const record = records[0];
    await pool.query(
      "UPDATE records SET data = $1 WHERE id = $2 AND user_id = $3",
      [{ ...record.data, last_check_in: now, silence_days: silence_days || record.data.silence_days }, record.id, u.userId]
    );
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await listRecords(u.userId, "_deadman");
  if (records.length === 0) {
    return NextResponse.json({ lastCheckIn: null, silenceDays: null, daysSinceCheckIn: null });
  }

  const record = records[0];
  const lastCheckIn = new Date(record.data.last_check_in);
  const silenceDays = record.data.silence_days;
  const daysSinceCheckIn = Math.floor((Date.now() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));

  return NextResponse.json({ lastCheckIn: record.data.last_check_in, silenceDays, daysSinceCheckIn });
}
