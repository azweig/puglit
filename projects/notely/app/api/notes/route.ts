import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, body: noteBody, tags, reminder } = body;

  if (!title || !noteBody) {
    return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
  }

  if (reminder && ('id' in reminder || 'is_completed' in reminder)) {
    return NextResponse.json({ error: "Invalid reminder structure" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const noteResult = await client.query(
      `INSERT INTO notes (user_id, title, body, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, created_at, updated_at`,
      [u.userId, title, noteBody]
    );
    const noteId = noteResult.rows[0].id;

    const createdNote = {
      id: noteId,
      title,
      body: noteBody,
      created_at: noteResult.rows[0].created_at,
      updated_at: noteResult.rows[0].updated_at
    };

    let createdTags = [];
    if (tags && tags.length > 0) {
      const tagInserts = tags.map(tag => {
        if (!('id' in tag) || !('name' in tag) || !('color' in tag)) {
          throw new Error('Invalid tag structure');
        }
        return client.query(
          `INSERT INTO tags (note_id, name, color) VALUES ($1, $2, $3) RETURNING id, name, color`,
          [noteId, tag.name, tag.color]
        );
      });
      const tagResults = await Promise.all(tagInserts);
      createdTags = tagResults.map(res => res.rows[0]);
    }

    let createdReminder = null;
    if (reminder) {
      const reminderResult = await client.query(
        `INSERT INTO reminders (note_id, reminder_time, is_completed) 
         VALUES ($1, $2, $3) RETURNING id, note_id, reminder_time, is_completed`,
        [noteId, reminder.reminder_time, false]
      );
      createdReminder = reminderResult.rows[0];
    }

    await client.query('COMMIT');

    return NextResponse.json({
      note: createdNote,
      tags: createdTags,
      reminder: createdReminder
    }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating note:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
  }
}