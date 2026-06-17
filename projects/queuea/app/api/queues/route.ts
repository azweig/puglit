import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  // Authenticate user
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  // Parse and validate request body
  let name: string, description: string;
  try {
    const body = await request.json();
    ({ name, description } = body);
    if (!name || !description) {
      throw new Error("Name and description are required.");
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  try {
    // Create new queue in the database
    const result = await pool.query(
      `INSERT INTO queues (name, description, user_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, name, description, created_at`,
      [name, description, u.userId]
    );

    const queue = result.rows[0];

    // Construct Queue object
    const createdQueue = {
      id: queue.id,
      name: queue.name,
      description: queue.description,
      created_at: new Date(queue.created_at).toISOString(),
    };

    // Return success response
    return NextResponse.json({ success: true, queue: createdQueue }, { status: 201 });
  } catch (error) {
    console.error("Error creating queue:", error);
    return NextResponse.json({ success: false, error: "Failed to create queue." }, { status: 500 });
  }
}