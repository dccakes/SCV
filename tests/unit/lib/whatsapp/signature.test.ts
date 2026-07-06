/**
 * @jest-environment node
 */

import { createHmac } from 'node:crypto'

import { validateTwilioSignature } from '~/lib/whatsapp/signature'

const AUTH_TOKEN = 'test-auth-token'
const URL = 'https://example.com/api/webhooks/whatsapp'

// Reference implementation of Twilio's documented algorithm: append each
// form param (sorted by key) as key+value to the URL, then HMAC-SHA1.
function signParams(url: string, params: Record<string, string>): string {
  const data =
    url +
    Object.keys(params)
      .sort()
      .map((key) => key + params[key])
      .join('')
  return createHmac('sha1', AUTH_TOKEN).update(data).digest('base64')
}

describe('validateTwilioSignature', () => {
  const params = {
    MessageSid: 'SM123',
    From: 'whatsapp:+5215512345678',
    To: 'whatsapp:+14155550100',
    Body: 'What time is the ceremony?',
  }

  it('accepts a correctly signed request', () => {
    const signature = signParams(URL, params)
    expect(validateTwilioSignature(AUTH_TOKEN, signature, URL, params)).toBe(true)
  })

  it('rejects a tampered body', () => {
    const signature = signParams(URL, params)
    const tampered = { ...params, Body: 'malicious' }
    expect(validateTwilioSignature(AUTH_TOKEN, signature, URL, tampered)).toBe(false)
  })

  it('rejects a signature made with the wrong token', () => {
    const wrong = createHmac('sha1', 'other-token').update(`${URL}BodyhiFrom+1`).digest('base64')
    expect(validateTwilioSignature(AUTH_TOKEN, wrong, URL, params)).toBe(false)
  })

  it('rejects missing or malformed signatures', () => {
    expect(validateTwilioSignature(AUTH_TOKEN, null, URL, params)).toBe(false)
    expect(validateTwilioSignature(AUTH_TOKEN, '', URL, params)).toBe(false)
    expect(validateTwilioSignature(AUTH_TOKEN, 'not-base64!!!', URL, params)).toBe(false)
  })
})
