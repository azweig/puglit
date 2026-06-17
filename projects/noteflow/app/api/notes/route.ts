import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { rows: notes } = await pool.query('SELECT * FROM notes WHERE user_id = $1', [u.userId]);

  for (const note of notes) {
    const { rows: reminders } = await pool.query('SELECT * FROM reminders WHERE note_id = $1', [note.id]);
    note.reminder = reminders[0] || null;

    const { rows: tags } = await pool.query('SELECT t.* FROM tags t JOIN note_tags nt ON t.id = nt.tag_id WHERE nt.note_id = $1', [note.id]);
    note.tags = tags;
  }

  return NextResponse.json({ notes });
}