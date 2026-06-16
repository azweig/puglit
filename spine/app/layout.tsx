import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import config from "@/domain.config"
import { LanguageProvider } from "@/lib/i18n"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" })

const brand = config.identity.brandColor || "#7c3aed"

export const metadata: Metadata = {
  title: { default: `${config.identity.name} — ${config.identity.tagline}`, template: `%s · ${config.identity.name}` },
  description: config.identity.tagline,
  metadataBase: new URL(`https://${config.identity.domain}`),
  openGraph: {
    title: config.identity.name,
    description: config.identity.tagline,
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
