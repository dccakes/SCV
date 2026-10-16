import { testMessages } from '~/../tests/unit/test-utils/intl'
import { clientMessages } from '~/i18n/client-messages'

describe('clientMessages', () => {
  it('keeps what client components read and drops server-only template copy', () => {
    const result = clientMessages(testMessages.es as Record<string, unknown>)

    expect(result).toHaveProperty('rsvp')
    expect(result).toHaveProperty('site.localeToggle')
    expect(Object.keys(result.voyage as object).sort()).toEqual([
      'flights',
      'nav',
      'pages',
      'stays',
    ])
    expect(result).not.toHaveProperty('classic')
    expect(result).not.toHaveProperty('templateShared')
    expect(JSON.stringify(result).length).toBeLessThan(JSON.stringify(testMessages.es).length / 2)
  })
})
