import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import config from "@/domain.config"
import { LanguageProvider } from "@/lib/i18n"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" })

const brand = config.identity.brandColor || "#7c3aed"

// Resolve a Localized value to a single string for SSR metadata (no client
// context here). Prefer English, then the product's first language.
const langs = config.identity.languages
function metaStr(v: string | Record<string, string>): string {
  if (typeof v === "string") return v
  return v.en ?? v[langs[0]] ?? Object.values(v)[0] ?? ""
}
const tagline = metaStr(config.identity.tagline)

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: { default: `${config.identity.name} — ${tagline}`, template: `%s · ${config.identity.name}` },
  description: tagline,
  metadataBase: new URL(`https://${config.identity.domain}`),
  openGraph: {
    title: config.identity.name,
    description: tagline,
    siteName: config.identity.name,
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={config.identity.languages[0] || "en"} style={{ ["--brand" as string]: brand }}>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  )
}
