/**
 * @jest-environment node
 */

import { createWhatsAppClient, WhatsAppClient } from '~/lib/whatsapp/client'

const ACCOUNT_SID = 'ACtest123'
const AUTH_TOKEN = 'auth-token-abc'

function jsonResponse(body: unknown, status = 201): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('WhatsAppClient', () => {
  describe('sendMessage', () => {
    it('posts form-encoded From/To/Body with whatsapp: prefixes and basic auth', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ sid: 'SM123' }))
      const client = new WhatsAppClient(
        { accountSid: ACCOUNT_SID, authToken: AUTH_TOKEN },
        fetchMock as unknown as typeof fetch
      )

      const result = await client.sendMessage('+14155550100', '+5215512345678', 'hello guests')

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`)
      expect(init.method).toBe('POST')
      expect(init.headers.authorization).toBe(
        `Basic ${Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64')}`
      )
      const params = new URLSearchParams(init.body)
      expect(params.get('From')).toBe('whatsapp:+14155550100')
      expect(params.get('To')).toBe('whatsapp:+5215512345678')
      expect(params.get('Body')).toBe('hello guests')
      expect(result).toEqual({ sid: 'SM123' })
    })

    it('does not double-prefix numbers already in whatsapp: form', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ sid: 'SM1' }))
      const client = new WhatsAppClient(
        { accountSid: ACCOUNT_SID, authToken: AUTH_TOKEN },
        fetchMock as unknown as typeof fetch
      )

      await client.sendMessage('whatsapp:+14155550100', 'whatsapp:+5215512345678', 'hi')

      const [, init] = fetchMock.mock.calls[0]
      const params = new URLSearchParams(init.body)
      expect(params.get('From')).toBe('whatsapp:+14155550100')
      expect(params.get('To')).toBe('whatsapp:+5215512345678')
    })

    it('throws with the Twilio error message on failure', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(
          jsonResponse({ code: 63016, message: 'Outside the allowed window' }, 400)
        )
      const client = new WhatsAppClient(
        { accountSid: ACCOUNT_SID, authToken: AUTH_TOKEN },
        fetchMock as unknown as typeof fetch
      )

      await expect(client.sendMessage('+1', '+2', 'hi')).rejects.toThrow(
        'Twilio API 63016: Outside the allowed window'
      )
    })
  })
})

describe('createWhatsAppClient', () => {
  it('throws when credentials are missing', () => {
    expect(() => createWhatsAppClient(undefined, undefined)).toThrow(
      'TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not configured'
    )
    expect(() => createWhatsAppClient('AC1', '')).toThrow(
      'TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not configured'
    )
  })

  it('returns a WhatsAppClient with valid credentials', () => {
    expect(createWhatsAppClient('AC1', 'token')).toBeInstanceOf(WhatsAppClient)
  })
})
