/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  clearMocks: true,
  collectCoverage: false, // Disable by default, enable with --coverage flag
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/__mocks__/**'],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: ['json', 'json-summary', 'lcov', 'text', 'html'],
  roots: ['<rootDir>/tests/unit'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.ts'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

// nextJest sets transformIgnorePatterns; we extend it to include ESM-only packages
// (copy-anything, is-what) pulled in transitively by superjson → @trpc/server.
export default async () => {
  const cfg = await (createJestConfig(config) as () => Promise<Config>)()

  const esmPackages = [
    'geist',
    'copy-anything',
    'is-what',
    'superjson',
    '@react-email',
    'jose',
    'react-phone-number-input',
    'libphonenumber-js',
    'posthog-node',
    'posthog-js',
    // ESM-only env builder (@t3-oss/env-nextjs + @t3-oss/env-core). Transforming
    // these lets `~/env` (src/env.js) be imported transitively in tests — e.g. a
    // client component that pulls in `~/trpc/react` — without per-test mocking.
    '@t3-oss',
  ]
  const pkg = esmPackages.join('|')

  cfg.transformIgnorePatterns = [
    `/node_modules/(?!.pnpm)(?!(${pkg})/)`,
    `/node_modules/.pnpm/(?!(${pkg})@)`,
    '^.+\\.module\\.(css|sass|scss)$',
  ]

  return cfg
}
