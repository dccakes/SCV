/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Note: Next.js 16 uses Turbopack exclusively for builds
  // Webpack is no longer available as a fallback
  // Local builds may fail due to Turbopack bundling issues
  // These should resolve in Vercel's production environment
};

export default config;
