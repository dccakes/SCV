import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Validates Twilio's X-Twilio-Signature header: HMAC-SHA1 over the full
 * webhook URL followed by every form param appended as key+value in
 * alphabetical key order, base64-encoded.
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
export function validateTwilioSignature(
  authToken: string,
  signature: string | null,
  url: string,
  params: Record<string, string>
): boolean {
  if (!signature) return false

  const data =
    url +
    Object.keys(params)
      .sort()
      .map((key) => key + params[key])
      .join('')

  const expected = createHmac('sha1', authToken).update(data).digest()

  let provided: Buffer
  try {
    provided = Buffer.from(signature, 'base64')
  } catch {
    return false
  }
  if (provided.length !== expected.length) return false
  return timingSafeEqual(provided, expected)
}
