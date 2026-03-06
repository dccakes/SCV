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
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: ['json', 'json-summary', 'lcov', 'text', 'html'],
  rootDir: './tests/unit',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./setup.ts'],
  moduleDirectories: ['node_modules', '<rootDir>/../../src'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/../../src/$1',
    '^@/(.*)$': '<rootDir>/../../src/$1',
  },
}

// nextJest sets transformIgnorePatterns; we extend it to include ESM-only packages
// (copy-anything, is-what) pulled in transitively by superjson → @trpc/server.
export default async () => {
  const cfg = await (createJestConfig(config) as () => Promise<Config>)()

  const esmPackages = ['geist', 'copy-anything', 'is-what']
  const pkg = esmPackages.join('|')

  cfg.transformIgnorePatterns = [
    `/node_modules/(?!.pnpm)(?!(${pkg})/)`,
    `/node_modules/.pnpm/(?!(${pkg})@)`,
    '^.+\\.module\\.(css|sass|scss)$',
  ]

  return cfg
}
