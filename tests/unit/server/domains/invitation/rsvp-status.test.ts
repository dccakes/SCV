/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs'

import { RSVP_STATUS as LIB_RSVP_STATUS } from '~/lib/constants/rsvp'
import {
  isRsvpStatus,
  RSVP_STATUS,
  RSVP_STATUS_VALUES,
  rsvpStatusSchema,
  toRsvpStatus,
} from '~/server/domains/invitation/rsvp-status'

describe('RSVP status', () => {
  it('has exactly the four allowed values', () => {
    expect([...RSVP_STATUS_VALUES].sort()).toEqual(
      ['Attending', 'Declined', 'Invited', 'Not Invited'].sort()
    )
  })

  it.each(RSVP_STATUS_VALUES)('accepts %s', (value) => {
    expect(isRsvpStatus(value)).toBe(true)
    expect(rsvpStatusSchema.safeParse(value).success).toBe(true)
  })

  it.each([
    'attending',
    'ATTENDING',
    'Maybe',
    'Yes',
    '',
    ' Attending',
    'NotInvited',
    null,
    1,
  ])('rejects %p', (value) => {
    expect(isRsvpStatus(value)).toBe(false)
    expect(rsvpStatusSchema.safeParse(value).success).toBe(false)
  })

  it('is the same list the client UI uses', () => {
    expect(LIB_RSVP_STATUS).toBe(RSVP_STATUS)
  })

  it('imports nothing but zod, so client components can import it safely', () => {
    const source = readFileSync('src/server/domains/invitation/rsvp-status.ts', 'utf8')
    const imports = [...source.matchAll(/from '([^']+)'/g)].map((match) => match[1])

    expect(imports).toEqual(['zod'])
  })
})

describe('toRsvpStatus', () => {
  it('keeps an allowed value', () => {
    expect(toRsvpStatus('Declined', 'Not Invited')).toBe('Declined')
  })

  it.each([null, undefined, 'Maybe'])('falls back for %p', (value) => {
    expect(toRsvpStatus(value, 'Not Invited')).toBe('Not Invited')
  })
})
