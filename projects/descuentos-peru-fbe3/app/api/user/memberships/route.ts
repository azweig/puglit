import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { program_id }: { program_id: number } = await request.json();
  try {
    await pool.query('INSERT INTO user_memberships (user_id, program_id) VALUES ($1, $2)', [u.userId, program_id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add membership' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { program_id }: { program_id: number } = await request.json();
  try {
    await pool.query('DELETE FROM user_memberships WHERE user_id = $1 AND program_id = $2', [u.userId, program_id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove membership' }, { status: 500 });
  }
}