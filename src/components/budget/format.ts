const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const currencyFormatterWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/** Format a number as USD. Drops cents when the value is a whole number. */
export function formatCurrency(value: number): string {
  return Number.isInteger(value)
    ? currencyFormatterWhole.format(value)
    : currencyFormatter.format(value)
}
