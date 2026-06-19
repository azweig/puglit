import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Eval/self-host builds: don't let lint or type noise block `next build`
  // (tsc runs separately; the remote box just needs a runnable prod build).
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Never let a proxy/browser cache the HTML/RSC of our dynamic pages (the RunPod
  // proxy was serving stale /campus). Static assets (_next, sprites) still cache.
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|sprites|favicon.ico).*)",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ]
  },
}

export default nextConfig
