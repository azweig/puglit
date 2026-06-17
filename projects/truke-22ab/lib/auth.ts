/**
 * Puglit Spine — auth.ts
 * Stateless JWT session: signed with JWT_SECRET (HS256), carried as an
 * httpOnly cookie on web and as a `Authorization: Bearer` header on mobile.
 * getAuthUser() transparently accepts either, so every API route is
 * web/mobile agnostic. No domain coupling — the payload is {userId,email,plan}.
 */
import { SignJWT, jwtVerify } from "jose"
import { NextRequest } from "next/server"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE_NAME = "auth_token"
const TOKEN_EXPIRY = "30d"
const MOBILE_TOKEN_EXPIRY = "365d"
const REFRESH_TOKEN_EXPIRY = "365d"

export interface JWTPayload {
  userId: number
  email: string
  plan: string
}

export async function signJWT(payload: JWTPayload, mobile = false): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(mobile ? MOBILE_TOKEN_EXPIRY : TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

export async function signRefreshToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload, type: "refresh" } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if ((payload as Record<string, unknown>).type !== "refresh") return null
    const { type, ...rest } = payload as Record<string, unknown>
    void type
    return rest as unknown as JWTPayload
  } catch {
    return null
  }
}

/** Bearer header first (mobile), then cookie (web). Returns null if neither is valid. */
export async function getAuthUser(request: NextRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return verifyJWT(authHeader.slice(7))
  }
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyJWT(token)
}

export function getAuthSource(request: NextRequest): "bearer" | "cookie" {
  return request.headers.get("Authorization")?.startsWith("Bearer ") ? "bearer" : "cookie"
}

export function setAuthCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    },
  }
}

export function clearAuthCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    },
  }
}
