import { escapeCsvValue, toCsv } from '~/lib/csv'

describe('escapeCsvValue', () => {
  it.each([
    ['+15551234567'],
    ['+1 (555) 123-4567'],
    ['-12.5'],
    ['555-0100'],
  ])('leaves the plain number %s as typed', (value) => {
    expect(escapeCsvValue(value)).toBe(value)
  })

  it.each([
    ['=SUM(A1:A2)', "'=SUM(A1:A2)"],
    ['+HYPERLINK("x")', `"'+HYPERLINK(""x"")"`],
    ['-2+cmd|x', "'-2+cmd|x"],
    ['@SUM(1)', "'@SUM(1)"],
    ['- no nuts', "'- no nuts"],
  ])('neutralizes the formula-like value %s', (value, expected) => {
    expect(escapeCsvValue(value)).toBe(expected)
  })

  it('quotes commas, quotes and newlines', () => {
    expect(toCsv([['a,b', 'say "hi"', 'line\nbreak']])).toBe('"a,b","say ""hi""","line\nbreak"')
  })
})
