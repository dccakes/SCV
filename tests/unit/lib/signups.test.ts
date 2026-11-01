jest.mock('~/env', () => ({
  env: {
    get ALLOW_SIGNUPS() {
      return process.env.ALLOW_SIGNUPS
    },
  },
}))

import { areSignupsAllowed } from '~/lib/signups'

describe('areSignupsAllowed', () => {
  afterEach(() => {
    delete process.env.ALLOW_SIGNUPS
  })

  it('allows signups when the flag is unset', () => {
    expect(areSignupsAllowed()).toBe(true)
  })

  it('allows signups when the flag is "true"', () => {
    process.env.ALLOW_SIGNUPS = 'true'
    expect(areSignupsAllowed()).toBe(true)
  })

  it('blocks signups when the flag is "false"', () => {
    process.env.ALLOW_SIGNUPS = 'false'
    expect(areSignupsAllowed()).toBe(false)
  })

  it('normalizes case and whitespace when env validation was skipped', () => {
    process.env.ALLOW_SIGNUPS = ' False '
    expect(areSignupsAllowed()).toBe(false)
  })
})
