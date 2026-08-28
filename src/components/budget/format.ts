import { DEFAULT_CURRENCY } from '~/lib/budget/currency'

const formatterCache = new Map<string, Intl.NumberFormat>()

function getFormatter(currency: string, whole: boolean): Intl.NumberFormat {
  const key = `${currency}-${whole}`
  let formatter = formatterCache.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: whole ? 0 : 2,
    })
    formatterCache.set(key, formatter)
  }
  return formatter
}

/**
 * Format a number in the given currency. Drops the fractional part when the
 * value is a whole number. Defaults to USD when no currency is provided.
 */
export function formatCurrency(value: number, currency: string = DEFAULT_CURRENCY): string {
  return getFormatter(currency, Number.isInteger(value)).format(value)
}
