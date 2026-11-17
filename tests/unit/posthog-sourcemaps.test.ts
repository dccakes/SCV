import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildPostHogSourcemapConfig } from '~/posthog-sourcemaps'

describe('buildPostHogSourcemapConfig', () => {
  it('stays off without a personal API key, so local and CI builds are unchanged', () => {
    expect(buildPostHogSourcemapConfig({ POSTHOG_PROJECT_ID: '123' })).toBeNull()
    expect(buildPostHogSourcemapConfig({ POSTHOG_PERSONAL_API_KEY: 'phx_1' })).toBeNull()
    expect(
      buildPostHogSourcemapConfig({ POSTHOG_PERSONAL_API_KEY: ' ', POSTHOG_PROJECT_ID: '123' })
    ).toBeNull()
  })

  it('uploads to the configured project and ties maps to the deployed commit', () => {
    expect(
      buildPostHogSourcemapConfig({
        POSTHOG_PERSONAL_API_KEY: 'phx_1',
        POSTHOG_PROJECT_ID: '123',
        NEXT_PUBLIC_POSTHOG_HOST: 'https://eu.posthog.com',
        VERCEL_GIT_COMMIT_SHA: 'abc123',
      })
    ).toEqual({
      personalApiKey: 'phx_1',
      projectId: '123',
      host: 'https://eu.posthog.com',
      sourcemaps: {
        enabled: true,
        releaseName: 'scv',
        releaseVersion: 'abc123',
        // Maps are uploaded, then removed so they are never served publicly.
        deleteAfterUpload: true,
      },
    })
  })

  it('leaves host and version to the plugin defaults when unset', () => {
    const config = buildPostHogSourcemapConfig({
      POSTHOG_PERSONAL_API_KEY: 'phx_1',
      POSTHOG_PROJECT_ID: '123',
    })
    expect(config).not.toHaveProperty('host')
    expect(config?.sourcemaps).not.toHaveProperty('releaseVersion')
  })
})

describe('next.config.js wiring', () => {
  const config = readFileSync(join(process.cwd(), 'next.config.js'), 'utf8')

  it('wraps the whole config with withPostHogConfig as the outermost wrapper', () => {
    // An inner position drops the PostHog build hooks (posthog-js#3572).
    expect(config).toMatch(/withPostHogConfig\(withNextIntl\(config\), posthogSourcemaps\)/)
  })
})
