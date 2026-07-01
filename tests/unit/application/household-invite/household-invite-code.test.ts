import {
  buildInviteCodePrefix,
  createHouseholdInviteCode,
} from '~/server/application/household-invite/household-invite-code'

describe('household invite code', () => {
  it('builds a readable prefix from the first guest’s initials', () => {
    expect(
      buildInviteCodePrefix([
        { firstName: 'John', lastName: 'Smith' },
        { firstName: 'Jane', lastName: 'Smith' },
      ])
    ).toBe('js')
  })

  it('falls back to "hh" when there are no guests or names are blank', () => {
    expect(buildInviteCodePrefix([])).toBe('hh')
    expect(buildInviteCodePrefix([{ firstName: '', lastName: '' }])).toBe('hh')
  })

  it('falls back to a first-initial-only prefix when the guest has no last name', () => {
    expect(buildInviteCodePrefix([{ firstName: 'John', lastName: null }])).toBe('j')
  })

  it('creates a code with a readable prefix and an 6-character random suffix', () => {
    const code = createHouseholdInviteCode([{ firstName: 'Ada', lastName: 'Lovelace' }])

    expect(code).toMatch(/^al-[23456789abcdefghjkmnpqrstuvwxyz]{6}$/)
  })

  it('generates different suffixes across calls', () => {
    const codes = new Set(
      Array.from({ length: 20 }, () =>
        createHouseholdInviteCode([{ firstName: 'Ada', lastName: 'Lovelace' }])
      )
    )

    expect(codes.size).toBe(20)
  })
})
