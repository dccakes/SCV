/**
 * @jest-environment node
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function readRepoFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

describe('domain barrel exports', () => {
  it.each([
    'src/server/domains/event/index.ts',
    'src/server/domains/guest-tag/index.ts',
    'src/server/domains/wedding/index.ts',
  ])('does not re-export routers from %s', (path) => {
    const source = readRepoFile(path)

    expect(source).not.toMatch(/export\s+\{\s*\w+Router\s*\}/)
  })
})
