import { randomBytes } from 'node:crypto'

// Excludes 0/1/i/l/o so codes read back unambiguously when spoken or typed.
const SUFFIX_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'
const SUFFIX_LENGTH = 6

const randomInviteCodeSuffix = (): string => {
  const bytes = randomBytes(SUFFIX_LENGTH)
  let suffix = ''
  for (const byte of bytes) {
    suffix += SUFFIX_ALPHABET[byte % SUFFIX_ALPHABET.length]
  }
  return suffix
}

const toInitial = (value: string): string => value.trim().charAt(0).toLowerCase()

/**
 * Readable prefix built from the first household member's initials (e.g. "js"
 * for "John Smith"), so the code is memorable enough to read aloud. This is a
 * mnemonic only, not the source of security -- the random suffix is, since
 * this code grants access to view and edit the household's mailing address
 * and contact details.
 */
export const buildInviteCodePrefix = (
  guests: Array<{ firstName: string; lastName: string | null }>
): string => {
  const [firstGuest] = guests
  if (!firstGuest) return 'hh'

  const initials = `${toInitial(firstGuest.firstName)}${toInitial(firstGuest.lastName ?? '')}`
  return initials || 'hh'
}

export const createHouseholdInviteCode = (
  guests: Array<{ firstName: string; lastName: string | null }>
): string => `${buildInviteCodePrefix(guests)}-${randomInviteCodeSuffix()}`
