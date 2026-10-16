import posthog from 'posthog-js'

import {
  BROWSER_SERVICE_NAME,
  POSTHOG_PROXY_PATH,
  parseSampleRate,
} from '~/lib/observability/config'

// Next.js runs this before hydration, including when the root layout fails.
const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const environment = process.env.NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT ?? 'development'
const version = process.env.NEXT_PUBLIC_APP_VERSION ?? 'development'

if (token) {
  try {
    posthog.init(token, {
      api_host: POSTHOG_PROXY_PATH,
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: '2026-05-30',
      capture_exceptions: true,
      // Adds X-POSTHOG-DISTINCT-ID / X-POSTHOG-SESSION-ID to same-origin
      // requests so server spans and errors join this person and replay.
      tracing_headers: [window.location.hostname],
      logs: {
        serviceName: BROWSER_SERVICE_NAME,
        environment,
        serviceVersion: version,
      },
      debug: process.env.NODE_ENV === 'development',
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
