import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

type DomainRow = {
  slug: string;
};

function isValidCustomDomain(domain: string): boolean {
  if (domain.length < 1 || domain.length > 253) return false;
  if (domain.includes("/") || domain.includes(":") || /\s/.test(domain)) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;

  const labels = domain.split(".");
  if (labels.length < 2) return false;

  return labels.every((label) => {
    if (label.length < 1 || label.length > 63) return false;
    if (label.startsWith("-") || label.endsWith("-")) return false;
    return /^[a-z0-9-]+$/i.test(label);
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDomain = searchParams.get("domain");

    if (rawDomain === null) {
      return NextResponse.json({ error: "domain is required" }, { status: 400 });
    }

    const domain = rawDomain.trim().toLowerCase();

    if (!isValidCustomDomain(domain)) {
      return NextResponse.json({ error: "invalid domain" }, { status: 400 });
    }

    const { rows } = await pool.query<DomainRow>(
      "SELECT slug FROM status_pages WHERE custom_domain = $1 AND is_public = TRUE LIMIT 1",
      [domain],
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({ slug: rows[0].slug }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v1/status-pages/by-domain failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
