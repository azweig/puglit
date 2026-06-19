import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Eval/self-host builds: don't let lint or type noise block `next build`
  // (tsc runs separately; the remote box just needs a runnable prod build).
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
}

export default nextConfig
