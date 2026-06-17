import type { NextConfig } from "next"

/** Standalone output → small Docker image (infra/Dockerfile copies .next/standalone).
 *  Disabled on Vercel (it manages its own output tracing). */
const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  reactStrictMode: true,
  poweredByHeader: false,
}

export default nextConfig
