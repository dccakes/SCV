/**
 * Supported budget currencies.
 *
 * Budgets are tracked in a single currency; there is no conversion between
 * currencies yet, so every target, section budget, and expense on a wedding
 * shares the one currency stored on the Budget row.
 */

export type SupportedCurrency = {
  code: string
  label: string
}

export const SUPPORTED_CURRENCIES: readonly SupportedCurrency[] = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'GBP', label: 'British Pound' },
] as const

export const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map((currency) => currency.code)

export const DEFAULT_CURRENCY = 'USD'

export function isSupportedCurrency(code: string): boolean {
  return SUPPORTED_CURRENCY_CODES.includes(code)
}
