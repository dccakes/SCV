jest.mock('~/env', () => ({
  env: {
    get ALLOW_SIGNUPS() {
      return process.env.ALLOW_SIGNUPS
    },
  },
}))

import { areSignupsAllowed } from '~/lib/signups'

describe('areSignupsAllowed', () => {
  const original = process.env.ALLOW_SIGNUPS

  afterEach(() => {
    if (original === undefined) delete process.env.ALLOW_SIGNUPS
    else process.env.ALLOW_SIGNUPS = original
  })

  it('allows signups when the flag is unset or empty', () => {
    delete process.env.ALLOW_SIGNUPS
    expect(areSignupsAllowed()).toBe(true)

    process.env.ALLOW_SIGNUPS = ''
    expect(areSignupsAllowed()).toBe(true)
  })

  it.each(['true', 'TRUE', ' true ', 'True\n'])('allows signups when the flag is %j', (value) => {
    process.env.ALLOW_SIGNUPS = value
    expect(areSignupsAllowed()).toBe(true)
  })

  it.each([
    'false',
    'FALSE',
    ' False ',
    'false\n',
  ])('blocks signups when the flag is %j', (value) => {
    process.env.ALLOW_SIGNUPS = value
    expect(areSignupsAllowed()).toBe(false)
  })

  it.each([
    '0',
    'no',
    'off',
    'disabled',
    'yes',
    '1',
  ])('fails closed for the malformed value %j (validation skipped)', (value) => {
    process.env.ALLOW_SIGNUPS = value
    expect(areSignupsAllowed()).toBe(false)
  })
})
