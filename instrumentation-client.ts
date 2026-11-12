import posthog from 'posthog-js'

import {
  BROWSER_SERVICE_NAME,
  POSTHOG_PROXY_PATH,
  parseSampleRate,
} from '~/lib/observability/config'

// Next.js runs this before hydration, including when the root layout fails.
const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const environment = process.env.NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT ?? 'development'
// The deployed commit; empty outside Vercel. Logs and traces need a value, but
// analytics leave app_version out when unknown, exactly as server events do.
const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || undefined
const version = appVersion ?? 'development'

if (token) {
  try {
    posthog.init(token, {
      api_host: POSTHOG_PROXY_PATH,
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      // Latest config snapshot. Bump deliberately: each date changes defaults
      // (see ConfigDefaults in posthog-js).
      defaults: '2026-08-30',
      capture_exceptions: true,
      // Explicit, not just the SDK default: anonymous guests must never get a
      // person profile (the same rule the server applies).
      person_profiles: 'identified_only',
      // Adds X-POSTHOG-DISTINCT-ID / X-POSTHOG-SESSION-ID to same-origin
      // requests so server spans and errors join this person and replay.
      tracing_headers: [window.location.hostname],
      logs: {
        serviceName: BROWSER_SERVICE_NAME,
        environment,
        serviceVersion: version,
      },
      debug: process.env.NODE_ENV === 'development',
      // Same keys the server sets (see deploymentProperties), on every browser
      // event and exception, so preview traffic can be filtered from production.
      // `loaded` runs before posthog-js sends anything, so even the first event has them.
      loaded: (instance) => {
        instance.register({ environment, ...(appVersion ? { app_version: appVersion } : {}) })
      },
    })
  } catch {
    // Analytics failing to start must not stop hydration.
  }

  // Loaded lazily so the OTel SDK stays out of the critical hydration path.
  // Document load timing is read from the Performance API, so nothing is lost.
  import('~/lib/observability/browser-tracing')
    .then(({ initBrowserTracing }) =>
      initBrowserTracing({
        token,
        sampleRate: parseSampleRate(process.env.NEXT_PUBLIC_OTEL_SAMPLE_RATE),
        environment,
        version,
      })
    )
    .catch(() => {
      // The UI stays usable when browser instrumentation is unavailable.
    })
}
