/**
 * Couple → attendee updates over WhatsApp.
 *
 * Sends manual or Etta-drafted updates to households through the wedding's
 * dedicated WhatsApp number, persisting every delivered message into the
 * household's conversation so Etta keeps full context when the household
 * replies. WhatsApp only delivers freeform messages inside the 24-hour window
 * opened by an attendee's last inbound message; sends outside it fail and are
 * reported per household rather than aborting the whole broadcast.
 *
 */

import { TRPCError } from '@trpc/server'

import type { WhatsAppClient } from '~/lib/whatsapp/client'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { MessagingService } from '~/server/domains/messaging/messaging.service'
import type { BroadcastRecipient } from '~/server/domains/messaging/messaging.types'

export interface WhatsAppOutboundDeps {
  messaging: MessagingService
  wa: WhatsAppClient
}

export interface BroadcastResult {
  sent: number
  failed: number
  unreachableHouseholds: number
}

export class WhatsAppOutboundService {
  private readonly messaging: MessagingService
  private readonly wa: WhatsAppClient

  constructor(deps: WhatsAppOutboundDeps) {
    this.messaging = deps.messaging
    this.wa = deps.wa
  }

  /** Sends an update to every reachable household (one message per household). */
  async broadcast(
    ctx: AuthzContext,
    input: { weddingId: string; message: string }
  ): Promise<BroadcastResult> {
    requirePermission(ctx, { guest_invitation: ['send'] })
    const serviceNumber = await this.requireServiceNumber(input.weddingId)
    const { recipients, unreachableHouseholdIds } = await this.messaging.getBroadcastRecipients(
      input.weddingId
    )

    let sent = 0
    let failed = 0
    for (const recipient of recipients) {
      const delivered = await this.deliver(input.weddingId, serviceNumber, recipient, input.message)
      if (delivered) {
        sent++
      } else {
        failed++
      }
    }

    return { sent, failed, unreachableHouseholds: unreachableHouseholdIds.length }
  }

  /** Sends an update to a single household. */
  async sendToHousehold(
    ctx: AuthzContext,
    input: {
      weddingId: string
      householdId: string
      message: string
    }
  ): Promise<{ identityId: string }> {
    requirePermission(ctx, { guest_invitation: ['send'] })
    const serviceNumber = await this.requireServiceNumber(input.weddingId)
    const { recipients } = await this.messaging.getBroadcastRecipients(input.weddingId)
    const recipient = recipients.find((r) => r.householdId === input.householdId)
    if (!recipient) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'This household has no phone number reachable over WhatsApp',
      })
    }

    const identityId = await this.deliverOrThrow(
      input.weddingId,
      serviceNumber,
      recipient,
      input.message
    )
    return { identityId }
  }

  private async requireServiceNumber(weddingId: string): Promise<string> {
    const number = await this.messaging.getWeddingWhatsAppNumber(weddingId)
    if (!number) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Claim a WhatsApp number for this wedding before sending updates',
      })
    }
    return number.phoneNumber
  }

  private async deliver(
    weddingId: string,
    serviceNumber: string,
    recipient: BroadcastRecipient,
    message: string
  ): Promise<boolean> {
    try {
      await this.deliverOrThrow(weddingId, serviceNumber, recipient, message)
      return true
    } catch {
      return false
    }
  }

  private async deliverOrThrow(
    weddingId: string,
    serviceNumber: string,
    recipient: BroadcastRecipient,
    message: string
  ): Promise<string> {
    await this.wa.sendMessage(serviceNumber, recipient.phone, message)

    let identityId = recipient.identityId
    if (!identityId) {
      if (recipient.guestId == null) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Recipient without an identity must reference a guest',
        })
      }
      const identity = await this.messaging.ensureWhatsAppIdentity({
        weddingId,
        serviceNumber,
        phone: recipient.phone,
        guestId: recipient.guestId,
        householdId: recipient.householdId,
        displayName: recipient.displayName || undefined,
      })
      identityId = identity.id
    }

    await this.messaging.appendMessage({
      identityId,
      weddingId,
      role: 'assistant',
      content: message,
    })

    return identityId
  }
}
