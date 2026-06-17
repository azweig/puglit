import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = parseInt(url.pathname.split('/').slice(-2, -1)[0], 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
  }

  // Check if user has 'view_predictions' permission
  const userPermissions = await fetchUserPermissions(u.userId);
  if (!userPermissions.includes('view_predictions')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { rows: predictions } = await pool.query(
      `SELECT id, member_id, predicted_date, likelihood FROM predictions WHERE member_id = $1`,
      [id]
    );

    return NextResponse.json(predictions, { status: 200 });
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function fetchUserPermissions(userId: number): Promise<string[]> {
  // Simulated function to retrieve user permissions
  // In a real implementation, this would query a permissions table or service
  return ['view_predictions'];
}
