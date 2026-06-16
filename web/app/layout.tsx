import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" })

export const metadata: Metadata = {
  title: { default: "Puglit — the open-core SaaS factory", template: "%s · Puglit" },
  description: "Describe your idea. Puglit ships a complete, monetizable, deployable SaaS — auth, payments, email, AI, admin, deploy included. Free while in beta.",
  metadataBase: new URL("https://puglit.com"),
  openGraph: { title: "Puglit", description: "Describe your idea → get a complete SaaS. Free open-core.", type: "website" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
