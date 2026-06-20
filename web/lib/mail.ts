/**
 * mail.ts — minimal transactional email (Resend). Graceful: with no RESEND_API_KEY it LOGS
 * the message instead of failing, so the passwordless login works in beta/dev without email
 * set up (you read the code from the server log). Returns whether it was actually sent.
 */
export async function sendLoginCode(email: string, code: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.PUGLIT_MAIL_FROM || "Puglit <onboarding@resend.dev>"
  if (!key) {
    console.log(`[mail] (no RESEND_API_KEY) código de acceso para ${email}: ${code}`)
    return false
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: email,
        subject: `Tu código Puglit: ${code}`,
        html: `<div style="font-family:system-ui;max-width:420px"><h2>Entrá a Puglit</h2><p>Tu código de acceso:</p><p style="font-size:32px;font-weight:800;letter-spacing:4px">${code}</p><p style="color:#888">Vence en 15 minutos. Si no fuiste vos, ignorá este mail.</p></div>`,
      }),
    })
    if (!res.ok) { console.error("[mail] resend", res.status, (await res.text().catch(() => "")).slice(0, 200)); return false }
    return true
  } catch (e) { console.error("[mail] failed:", (e as Error).message); return false }
}
