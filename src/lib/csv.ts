// Phone numbers and plain numbers like "+15551234567" or "-12.5" start with a
// formula character but cannot run anything, so they are left as typed.
// Prefixing them would put a visible apostrophe in every phone cell and stop
// the file from being re-imported.
const PLAIN_NUMBER = /^[+-]?[\d\s().-]+$/

// Prefix values a spreadsheet would evaluate as a formula
const neutralizeFormula = (value: string): string =>
  /^[=+\-@\t\r]/.test(value) && !PLAIN_NUMBER.test(value) ? `'${value}` : value

/** Escape one cell: neutralize formulas, then quote when it holds a comma, quote or newline. */
export const escapeCsvValue = (raw: string): string => {
  const value = neutralizeFormula(raw)
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

/** Join rows of raw cell values into CSV text with CRLF line endings. */
export const toCsv = (rows: ReadonlyArray<ReadonlyArray<string>>): string =>
  rows.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n')
