/**
 * Single source of truth for the ALLOW_SIGNUPS flag.
 *
 * The flag is "true" by default. Only the literal string "false" disables signups.
 * The env schema already rejects any other value at boot, but validation is skipped
 * when SKIP_ENV_VALIDATION is set, so this helper stays defensive and normalizes input.
 */
import { env } from '~/env'

export const SIGNUPS_DISABLED_MESSAGE = 'Sign ups are currently closed.'

export function areSignupsAllowed(): boolean {
  return (
    String(env.ALLOW_SIGNUPS ?? 'true')
      .trim()
      .toLowerCase() !== 'false'
  )
}
