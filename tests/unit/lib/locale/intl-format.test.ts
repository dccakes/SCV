import { formatEventTime } from '~/lib/locale/intl-format'

describe('formatEventTime', () => {
  it('keeps English times exactly as the couple entered them', () => {
    expect(formatEventTime('15:30', 'en')).toBe('15:30')
    expect(formatEventTime('5:00 PM', 'en')).toBe('5:00 PM')
  })

  it('shows Spanish visitors 24-hour times', () => {
    expect(formatEventTime('15:30', 'es')).toBe('15:30')
    expect(formatEventTime('5:00 PM', 'es')).toBe('17:00')
    expect(formatEventTime('12:15 a.m.', 'es')).toBe('00:15')
    expect(formatEventTime('12:00pm', 'es')).toBe('12:00')
    expect(formatEventTime('9:05 am', 'es')).toBe('09:05')
  })

  it('leaves free text it cannot read untouched', () => {
    expect(formatEventTime('Sunset', 'es')).toBe('Sunset')
    expect(formatEventTime('', 'es')).toBe('')
  })
})
