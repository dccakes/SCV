/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
// biome-ignore lint/style/noRestrictedImports: Next.js config requires relative import
await import('./src/env.js')

/** @type {import("next").NextConfig} */
const config = {
  // Enable standalone output for Docker deployments
  output: 'standalone',
  eslint: {
    // Temporarily ignore ESLint during builds due to v9 config format issue
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Still type check during builds
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ['date-fns', 'lucide-react', 'react-icons'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.swamp.wed',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  env: {
    // Resolve app URL: explicit env var → Vercel branch URL → localhost fallback
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_BRANCH_URL
        ? `https://${process.env.VERCEL_BRANCH_URL}`
        : 'http://localhost:3000'),
  },
}

export default config
