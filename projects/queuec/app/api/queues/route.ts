import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createRecord } from "@/lib/records";

export async function POST(request: NextRequest) {
  // Check for Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: "Authorization header missing or malformed" }, { status: 401 });
  }

  // Authenticate user
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Parse request body
  const { queue_name, status } = await request.json();

  // Validate request body
  if (typeof queue_name !== 'string' || !['active', 'inactive'].includes(status)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Create new queue
  const newQueue = {
    queue_name,
    created_at: new Date().toISOString(), // Convert Date to ISO 8601 string
    status
  };

  // Save to database (per-user storage)
  await createRecord(u.userId, 'queues', newQueue);

  // Respond with created queue
  return NextResponse.json(newQueue, { status: 201 });
}