/**
 * Wedding inbound-email address helpers.
 *
 * Every wedding gets a dedicated address of the form
 * `{bride}-and-{groom}@{WEDDING_EMAIL_DOMAIN}` (default domain
 * `w.oswp.carvallo.io`). The local part is a slug derived from the couple's
 * first names; collisions are disambiguated by the service layer with a numeric
 * suffix (`jane-and-john-2`).
 */

import { env } from '~/env'

/** Domain that receives all per-wedding inbound mail. */
export function weddingEmailDomain(): string {
  return env.WEDDING_EMAIL_DOMAIN
}

/**
 * Slugify a single name: lower-case, strip accents, keep alphanumerics only.
 * Empty/undefined names collapse to an empty string so callers can fall back.
 */
export function slugifyName(name: string | null | undefined): string {
  if (!name) return ''
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

/**
 * Build the base local part for a couple, e.g. `jane-and-john`.
 * Falls back to `partner` when a name slugifies to empty.
 */
export function buildWeddingLocalPart(brideFirstName: string, groomFirstName: string): string {
  const bride = slugifyName(brideFirstName) || 'partner'
  const groom = slugifyName(groomFirstName) || 'partner'
  return `${bride}-and-${groom}`
}

/** Compose a full inbound address from a local part. */
export function composeWeddingAddress(localPart: string): string {
  return `${localPart}@${weddingEmailDomain()}`.toLowerCase()
}

/**
 * Add or replace a numeric collision suffix on a base local part.
 * `withLocalPartSuffix('jane-and-john', 2)` → `jane-and-john-2`.
 * Suffix `1` (or less) returns the base unchanged.
 */
export function withLocalPartSuffix(baseLocalPart: string, suffix: number): string {
  if (suffix <= 1) return baseLocalPart
  return `${baseLocalPart}-${suffix}`
}

/** Extract and normalize the local part from a full address. */
export function localPartOf(address: string): string {
  return address.trim().toLowerCase().split('@')[0] ?? ''
}
