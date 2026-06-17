import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
    const u = await getAuthUser(request);
    if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const match_id = searchParams.get('match_id');
    if (!match_id) return NextResponse.json({ error: 'match_id is required' }, { status: 400 });
    const { rows } = await pool.query('SELECT * FROM messages WHERE match_id=$1 ORDER BY sent_at ASC', [match_id]);
    return NextResponse.json(rows);
}