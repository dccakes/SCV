/**
 * WhatsApp guest-concierge orchestration layer.
 *
 * Attendees text the wedding's dedicated WhatsApp number; the sender's phone
 * is matched to a guest, giving Etta a distinct per-household conversation
 * with the restricted concierge toolset. Called from the WhatsApp webhook
 * `after()` hook so every run is fire-and-forget relative to the response.
 *
 * Debounce model mirrors the Telegram handler: each inbound message bumps
 * `MessagingIdentity.pendingInvokeSeq` and only the callback whose captured
 * seq still matches actually runs Etta — bursts collapse into a single turn.
 */

import type { ModelMessage } from 'ai'
import type { runEttaAgent } from '~/lib/etta/agent'
import type { WhatsAppClient } from '~/lib/whatsapp/client'
import type { TwilioInboundMessage } from '~/lib/whatsapp/types'
import { stripWhatsAppPrefix } from '~/lib/whatsapp/types'
import type { MessagingService } from '~/server/domains/messaging/messaging.service'
import type { MessagingIdentity } from '~/server/domains/messaging/messaging.types'

const DEFAULT_DEBOUNCE_MS = 4_000

const UNKNOWN_GUEST_REPLY =
  "Hi! I'm Etta, the wedding assistant. I couldn't find this phone number on the guest list, " +
  'so I can’t share wedding details here yet. If you think this is a mistake, please reach out ' +
  'to the couple so they can add or update your number.'

export interface WhatsAppHandlerDeps {
  messaging: MessagingService
  wa: WhatsAppClient
  runEtta: typeof runEttaAgent
  debounceMs?: number
  sleep?: (ms: number) => Promise<void>
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

export class WhatsAppHandler {
  private readonly messaging: MessagingService
  private readonly wa: WhatsAppClient
  private readonly runEtta: typeof runEttaAgent
  private readonly debounceMs: number
  private readonly sleep: (ms: number) => Promise<void>

  constructor(deps: WhatsAppHandlerDeps) {
    this.messaging = deps.messaging
    this.wa = deps.wa
    this.runEtta = deps.runEtta
    this.debounceMs = deps.debounceMs ?? DEFAULT_DEBOUNCE_MS
    this.sleep = deps.sleep ?? defaultSleep
  }

  async handle(inbound: TwilioInboundMessage): Promise<void> {
    const serviceNumber = stripWhatsAppPrefix(inbound.To)
    const attendeePhone = stripWhatsAppPrefix(inbound.From)
    const text = inbound.Body?.trim()
    if (!text) return

    const resolved = await this.messaging.resolveInboundWhatsApp({
      serviceNumber,
      attendeePhone,
      profileName: inbound.ProfileName,
    })

    if (resolved.status === 'unknown_number') return

    if (resolved.status === 'unknown_guest') {
      await this.wa.sendMessage(serviceNumber, attendeePhone, UNKNOWN_GUEST_REPLY)
      return
    }

    const { identity, weddingId } = resolved

    await this.messaging.appendMessage({
      identityId: identity.id,
      weddingId,
      role: 'user',
      content: text,
      externalMessageId: inbound.MessageSid,
    })

    const seq = await this.messaging.bumpPendingInvokeSeq(identity.id)
    await this.sleep(this.debounceMs)
    const current = await this.messaging.getPendingInvokeSeq(identity.id)
    if (current !== seq) return

    await this.invokeEtta(identity, weddingId, serviceNumber, attendeePhone)
  }

  private async invokeEtta(
    identity: MessagingIdentity,
    weddingId: string,
    serviceNumber: string,
    attendeePhone: string
  ): Promise<void> {
    const buffer = await this.messaging.loadConversation(identity.id)
    const messages: ModelMessage[] = buffer.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
    if (messages.length === 0) return

    const result = await this.runEtta({
      actor: 'guest',
      weddingId,
      guestId: identity.guestId ?? undefined,
      messages,
    })
    const text = await result.text

    if (text.trim().length === 0) return

    await this.wa.sendMessage(serviceNumber, attendeePhone, text)
    await this.messaging.appendMessage({
      identityId: identity.id,
      weddingId,
      role: 'assistant',
      content: text,
    })
  }
}
