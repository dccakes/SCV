const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01'

interface TwilioErrorPayload {
  code?: number
  message?: string
}

export interface WhatsAppClientConfig {
  accountSid: string
  authToken: string
}

const withWhatsAppPrefix = (number: string): string =>
  number.startsWith('whatsapp:') ? number : `whatsapp:${number}`

export class WhatsAppClient {
  constructor(
    private readonly config: WhatsAppClientConfig,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  /**
   * Sends a WhatsApp message via the Twilio Messages API. Freeform bodies are
   * only deliverable inside the 24-hour customer-service window opened by the
   * recipient's last inbound message; callers surface Twilio's error otherwise.
   */
  async sendMessage(from: string, to: string, body: string): Promise<{ sid: string }> {
    const params = new URLSearchParams({
      From: withWhatsAppPrefix(from),
      To: withWhatsAppPrefix(to),
      Body: body,
    })

    const response = await this.fetchImpl(
      `${TWILIO_API_BASE}/Accounts/${this.config.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          authorization: `Basic ${Buffer.from(
            `${this.config.accountSid}:${this.config.authToken}`
          ).toString('base64')}`,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    )

    const payload = (await response.json()) as { sid?: string } & TwilioErrorPayload
    if (response.status >= 400) {
      throw new Error(
        `Twilio API ${payload.code ?? response.status}: ${payload.message ?? 'unknown error'}`
      )
    }
    return { sid: payload.sid ?? '' }
  }
}

export function createWhatsAppClient(accountSid?: string, authToken?: string): WhatsAppClient {
  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not configured')
  }
  return new WhatsAppClient({ accountSid, authToken })
}
