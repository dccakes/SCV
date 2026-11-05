// A single number such as a stored phone number "+15551234567" or "-12.5"
// starts with a formula character but cannot run anything, so it is left as
// typed. Anything longer, like "+1-555-0100", is still prefixed: a spreadsheet
// would otherwise evaluate it as arithmetic and silently change the value.
const SINGLE_NUMBER = /^[+-]?\d+(\.\d+)?$/

// Prefix values a spreadsheet would evaluate as a formula
const neutralizeFormula = (value: string): string =>
  /^[=+\-@\t\r]/.test(value) && !SINGLE_NUMBER.test(value) ? `'${value}` : value

/** Escape one cell: neutralize formulas, then quote when it holds a comma, quote or newline. */
export const escapeCsvValue = (raw: string): string => {
  const value = neutralizeFormula(raw)
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

/** Join rows of raw cell values into CSV text with CRLF line endings. */
export const toCsv = (rows: ReadonlyArray<ReadonlyArray<string>>): string =>
  rows.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n')
