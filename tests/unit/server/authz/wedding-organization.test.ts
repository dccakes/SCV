import {
  buildWeddingOrganizationName,
  buildWeddingOrganizationSlug,
  mapLegacyRole,
} from '~/server/authz/wedding-organization'

describe('wedding organization helpers', () => {
  it('slugs the workspace after its wedding, as the one-time migration did', () => {
    expect(buildWeddingOrganizationSlug('abc123')).toBe('wedding-abc123')
  })

  it('names the workspace after the couple', () => {
    expect(buildWeddingOrganizationName({ groomFirstName: 'Sam', brideFirstName: 'Alex' })).toBe(
      'Sam & Alex'
    )
  })

  it('maps legacy UserWedding roles to organization roles, defaulting to the least access', () => {
    expect(mapLegacyRole('owner')).toBe('owner')
    expect(mapLegacyRole('admin')).toBe('admin')
    expect(mapLegacyRole('editor')).toBe('member')
    expect(mapLegacyRole('member')).toBe('member')
    expect(mapLegacyRole('something-unknown')).toBe('viewer')
  })
})
