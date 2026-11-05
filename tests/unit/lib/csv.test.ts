import { escapeCsvValue, toCsv } from '~/lib/csv'

describe('escapeCsvValue', () => {
  it.each([
    ['+15551234567'],
    ['-12.5'],
    ['42'],
    ['555-0100'],
    [''],
  ])('leaves %p as typed', (value) => {
    expect(escapeCsvValue(value)).toBe(value)
  })

  it.each([
    // Spreadsheets would evaluate these as arithmetic and change the value
    ['+1-555-0100', "'+1-555-0100"],
    ['+1 (555) 123-4567', "'+1 (555) 123-4567"],
    ['+1-1', "'+1-1"],
    ['=SUM(A1:A2)', "'=SUM(A1:A2)"],
    ['+HYPERLINK("x")', `"'+HYPERLINK(""x"")"`],
    ['-2+cmd|x', "'-2+cmd|x"],
    ['@SUM(1)', "'@SUM(1)"],
    ['\tcmd', "'\tcmd"],
    ['- no nuts', "'- no nuts"],
  ])('neutralizes the formula-like value %p', (value, expected) => {
    expect(escapeCsvValue(value)).toBe(expected)
  })

  it('neutralizes a leading carriage return and then quotes it', () => {
    expect(escapeCsvValue('\rcmd')).toBe(`"'\rcmd"`)
  })
})

describe('toCsv', () => {
  it('quotes commas, quotes and newlines and joins rows with CRLF', () => {
    expect(
      toCsv([
        ['a,b', 'say "hi"'],
        ['line\nbreak', 'plain'],
      ])
    ).toBe('"a,b","say ""hi"""\r\n"line\nbreak",plain')
  })
})
