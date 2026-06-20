/**
 * middleware — gate the genetic console behind login. Edge runtime can't verify the HMAC
 * (node:crypto), so this only checks the session cookie is PRESENT and redirects to /login
 * if not; the real signature check happens server-side (getSession, node runtime) wherever
 * data is actually read/written. Enough to gate the UI for the multi-user beta.
 */
import { NextResponse, type NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  if (req.cookies.get("puglit_session")?.value) return NextResponse.next()
  const url = req.nextUrl.clone()
  url.pathname = "/login"
  url.searchParams.set("next", req.nextUrl.pathname)
  return NextResponse.redirect(url)
}

// only the console pages — NOT the home, /login, or /api/* (auth endpoints stay public)
export const config = {
  matcher: ["/campus", "/campus/:path*", "/tournament", "/tournament/:path*", "/generate", "/generate/:path*", "/build/:path*", "/roster", "/roster/:path*", "/projects", "/projects/:path*"],
}
