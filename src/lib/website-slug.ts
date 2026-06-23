/**
 * Wedding website slug (subUrl) helpers.
 *
 * Shared between the server (publish/validation) and the client (publish UI
 * pre-population and live validation) so the derived default and the accepted
 * format stay in sync.
 */

export const WEDDING_SUBURL_PATTERN = /^\w+$/

export type CoupleNames = {
  groomFirstName: string
  groomLastName: string
  brideFirstName: string
  brideLastName: string
}

/**
 * Build a default slug from the couple's names, e.g. "johndoeandjanesmith".
 * Strips anything that isn't a slug-safe character so the default always
 * satisfies WEDDING_SUBURL_PATTERN.
 */
export function deriveWeddingSubUrl(names: CoupleNames): string {
  return `${names.groomFirstName}${names.groomLastName}and${names.brideFirstName}${names.brideLastName}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
}

export function isValidWeddingSubUrl(subUrl: string): boolean {
  return WEDDING_SUBURL_PATTERN.test(subUrl)
}
