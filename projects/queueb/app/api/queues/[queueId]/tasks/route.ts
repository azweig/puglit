import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  // Authenticate the user
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Extract queueId from the URL path
  const urlParts = request.nextUrl.pathname.split('/');
  const queueId = urlParts[urlParts.length - 1];
  if (!queueId) return NextResponse.json({ error: 'Queue ID is required' }, { status: 400 });

  // Parse the request body
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, details, due_date } = body;
  if (!title || !details || !due_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate due_date format
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(due_date)) {
    return NextResponse.json({ error: 'Invalid due_date format' }, { status: 400 });
  }

  // Validate the queue access
  const queueCheckQuery = 'SELECT * FROM queues WHERE id = $1 AND is_active = true';
  const queueResult = await pool.query(queueCheckQuery, [queueId]);
  if (queueResult.rowCount === 0) {
    return NextResponse.json({ error: 'Queue not found or inactive' }, { status: 404 });
  }

  // Check user permissions (Assuming a simple check for demonstration)
  const userPermissionQuery = 'SELECT * FROM user_queues WHERE user_id = $1 AND queue_id = $2';
  const permissionResult = await pool.query(userPermissionQuery, [u.userId, queueId]);
  if (permissionResult.rowCount === 0) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Insert the new task into the database
  const insertTaskQuery = `
    INSERT INTO tasks (queue_id, title, details, due_date, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, queue_id, title, details, due_date, status
  `;
  const taskResult = await pool.query(insertTaskQuery, [
    queueId,
    title,
    details,
    due_date,
    'pending'
  ]);

  const newTask = taskResult.rows[0];

  // Return the created task
  return NextResponse.json(newTask, { status: 201 });
}