/**
 * Twilio WhatsApp webhook payload (form-encoded). Only the fields we consume;
 * Twilio sends more. `From`/`To` arrive as `whatsapp:+E164`.
 */
export interface TwilioInboundMessage {
  MessageSid: string
  From: string
  To: string
  Body?: string
  ProfileName?: string
  NumMedia?: string
  WaId?: string
}

/** Strips the `whatsapp:` channel prefix, leaving the bare E.164 number. */
export const stripWhatsAppPrefix = (value: string): string =>
  value.startsWith('whatsapp:') ? value.slice('whatsapp:'.length) : value
