/**
 * Single source of truth for the ALLOW_SIGNUPS flag.
 *
 * Unset (or empty) means signups are open. "true" means open. Anything else closes signups.
 * The env schema already rejects values other than "true" and "false" at boot, but validation
 * is skipped when SKIP_ENV_VALIDATION is set, so a malformed value such as "0", "no" or "False "
 * must not silently leave a security switch open: it fails closed here.
 */
import { env } from '~/env'

export const SIGNUPS_DISABLED_MESSAGE = 'Sign ups are currently closed.'

export function areSignupsAllowed(): boolean {
  const raw = env.ALLOW_SIGNUPS
  if (raw === undefined || raw === null) return true

  const value = String(raw).trim().toLowerCase()
  return value === '' || value === 'true'
}
