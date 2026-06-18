/**
 * Puglit Spine — auth-emails.ts
 * Generic, brand-aware transactional templates for the auth flows. All copy
 * pulls name/color/domain from domain.config so a generated project reads
 * correctly without editing this file. Token TTLs centralized here.
 */
import config from "@/domain.config"
import { sendEmail } from "@/lib/mailer"
import { createToken } from "@/lib/users"

const BRAND = config.identity.name
const COLOR = config.identity.brandColor || "#7C3AED"
const BASE_URL = process.env.APP_URL || `https://${config.identity.domain}`

export const TTL = {
  verify: 24 * 60 * 60 * 1000, // 24h
  reset: 60 * 60 * 1000,       // 1h
  magic: 15 * 60 * 1000,       // 15m
}

function shell(title: string, body: string, cta?: { label: string; url: string }): string {
  return `<div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;background:#0E0B1A;color:#EDEAF6;padding:32px;border-radius:14px">
    <h1 style="color:${COLOR};text-align:center;margin:0 0 16px">${title}</h1>
    <div style="font-size:15px;line-height:1.6">${body}</div>
    ${cta ? `<div style="text-align:center;margin:24px 0"><a href="${cta.url}" style="background:${COLOR};color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:600">${cta.label}</a></div>` : ""}
    <p style="color:#8b85a8;font-size:12px;text-align:center;margin-top:24px">${BRAND}</p>
  </div>`
}

export async function sendVerificationEmail(userId: number, email: string, name: string): Promise<void> {
  const token = await createToken("verify", userId, email, TTL.verify)
  const url = `${BASE_URL}/api/auth/verify-email?token=${token}`
  await sendEmail(email, `Confirm your email · ${BRAND}`,
    shell("Confirm your email",
      `<p>Hi ${name || "there"}, welcome to ${BRAND}. Confirm your email to secure your account.</p>`,
      { label: "Confirm email", url }))
}

export async function sendPasswordResetEmail(userId: number, email: string, name: string): Promise<void> {
  const token = await createToken("reset", userId, email, TTL.reset)
  const url = `${BASE_URL}/reset-password?token=${token}`
  await sendEmail(email, `Reset your password · ${BRAND}`,
    shell("Reset your password",
      `<p>Hi ${name || "there"}, we received a request to reset your password. This link expires in 1 hour. If it wasn't you, ignore this email.</p>`,
      { label: "Reset password", url }))
}

export async function sendMagicLinkEmail(userId: number | null, email: string): Promise<void> {
  const token = await createToken("magic", userId, email, TTL.magic)
  const url = `${BASE_URL}/api/auth/magic-link/consume?token=${token}`
  await sendEmail(email, `Your sign-in link · ${BRAND}`,
    shell("Sign in",
      `<p>Click below to sign in to ${BRAND}. This link expires in 15 minutes and can only be used once.</p>`,
      { label: "Sign in", url }))
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await sendEmail(email, `Welcome to ${BRAND}!`,
    shell(`Welcome to ${BRAND}!`,
      `<p>Hi ${name || "there"}, your account is ready. ${config.identity.tagline}</p>`,
      { label: "Open the app", url: BASE_URL }))
}
