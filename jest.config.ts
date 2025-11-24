/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import dotenv from 'dotenv'
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

dotenv.config({ path: '.env.test' })
dotenv.config({ path: '.env.test.local' })

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  rootDir: './tests/unit',
  testEnvironment: 'jsdom',
  transform: {},
  setupFilesAfterEnv: ['./setup.ts'],
  moduleDirectories: ['node_modules', 'src'],
  transformIgnorePatterns: [
    'node_modules/(?!(next-sanity|@sanity|sanity|use-supercluster|@next-degree|nanoid|@sanity/client)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../src/$1',
    '^use-supercluster$': '<rootDir>/../../tests/mocks/use-supercluster.ts',
    '^nanoid$': '<rootDir>/../../tests/mocks/nanoid.ts',
    '^nanoid/(.*)$': '<rootDir>/../../tests/mocks/nanoid.ts',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
}

export default createJestConfig(config)
