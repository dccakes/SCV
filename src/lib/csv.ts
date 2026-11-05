// Prefix values a spreadsheet would evaluate as a formula
const neutralizeFormula = (value: string): string =>
  /^[=+\-@\t\r]/.test(value) ? `'${value}` : value

/** Escape one cell: neutralize formulas, then quote when it holds a comma, quote or newline. */
export const escapeCsvValue = (raw: string): string => {
  const value = neutralizeFormula(raw)
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

/** Join rows of raw cell values into CSV text with CRLF line endings. */
export const toCsv = (rows: ReadonlyArray<ReadonlyArray<string>>): string =>
  rows.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n')
