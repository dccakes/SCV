import {
  buildWeddingOrganizationSlug,
  mapLegacyRole,
  parseArgs,
} from '~/server/scripts/migrate-user-weddings-to-organizations'

describe('migrate-user-weddings-to-organizations helpers', () => {
  it('maps legacy roles to organization roles', () => {
    expect(mapLegacyRole('owner')).toBe('owner')
    expect(mapLegacyRole('admin')).toBe('admin')
    expect(mapLegacyRole('editor')).toBe('member')
    expect(mapLegacyRole('member')).toBe('member')
    expect(mapLegacyRole('something-unknown')).toBe('viewer')
  })

  it('builds deterministic wedding organization slugs', () => {
    expect(buildWeddingOrganizationSlug('abc123')).toBe('wedding-abc123')
  })

  it('parses command args with write and dry-run precedence', () => {
    expect(parseArgs(['--dry-run']).dryRun).toBe(true)
    expect(parseArgs(['--write']).dryRun).toBe(false)
    expect(parseArgs([]).dryRun).toBe(true)
  })
})
