/**
 * PostHog error tracking source map upload, used by `withPostHogConfig` in next.config.js.
 *
 * Plain JS because next.config.js can't import TypeScript. Opt-in: without a personal API key
 * and project id the config is `null` and next.config.js skips the wrapper entirely, so local,
 * Docker, and CI builds behave exactly as before.
 *
 * Set both on the production build (e.g. Vercel Production env vars). The key needs the
 * `error tracking write` and `organization read` scopes. It is build-time only and must never be
 * exposed as a NEXT_PUBLIC_ variable.
 */

/** @param {string | undefined} value */
const nonBlank = (value) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * @param {Readonly<Record<string, string | undefined>>} env
 * @returns {Parameters<typeof import('@posthog/nextjs-config').withPostHogConfig>[1] | null}
 */
export function buildPostHogSourcemapConfig(env = process.env) {
  const personalApiKey = nonBlank(env.POSTHOG_PERSONAL_API_KEY)
  const projectId = nonBlank(env.POSTHOG_PROJECT_ID)
  if (!personalApiKey || !projectId) return null

  // The UI host (us.posthog.com / eu.posthog.com), not the ingestion host.
  const host = nonBlank(env.NEXT_PUBLIC_POSTHOG_HOST)
  const releaseVersion = nonBlank(env.VERCEL_GIT_COMMIT_SHA)

  return {
    personalApiKey,
    projectId,
    ...(host ? { host } : {}),
    sourcemaps: {
      enabled: true,
      releaseName: 'scv',
      // Same value as the server `service.version` and browser NEXT_PUBLIC_APP_VERSION.
      ...(releaseVersion ? { releaseVersion } : {}),
      deleteAfterUpload: true,
    },
  }
}
