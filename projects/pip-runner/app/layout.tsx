import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Pip Runner — 8 mundos",
  description: "Endless runner original con 8 mundos × 8 niveles, jugable en celular. Personajes propios.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
