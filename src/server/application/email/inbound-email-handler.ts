/**
 * Inbound email orchestration.
 *
 * Runs in the Resend webhook's `after()` hook, so it is fire-and-forget
 * relative to the webhook ack. For each inbound message it:
 *   1. records the message into the wedding's threaded conversation (idempotent)
 *   2. links the thread to a known vendor when the sender matches
 *   3. runs AI triage and persists the verdict
 *   4. executes low-risk auto-actions (forwarding contracts to the couple)
 *   5. drops a notification so the couple sees it in-app
 */

import type { InboundEmail } from '~/lib/email/resend-webhook'
import type { triageEmail } from '~/lib/email/triage'
import type { EmailService, WeddingEmailInbox } from '~/server/domains/email'

export interface InboundEmailHandlerDeps {
  email: EmailService
  triage: typeof triageEmail
}

export class InboundEmailHandler {
  private readonly email: EmailService
  private readonly triage: typeof triageEmail

  constructor(deps: InboundEmailHandlerDeps) {
    this.email = deps.email
    this.triage = deps.triage
  }

  async handle(inbox: WeddingEmailInbox, inbound: InboundEmail): Promise<void> {
    const weddingId = inbox.weddingId

    const { thread, message, isNew } = await this.email.recordInbound({
      weddingId,
      inboxId: inbox.id,
      conversationId: inbound.conversationId,
      fromAddress: inbound.fromAddress,
      fromName: inbound.fromName,
      toAddresses: inbound.to,
      ccAddresses: inbound.cc,
      subject: inbound.subject,
      text: inbound.text,
      html: inbound.html,
      providerId: inbound.providerId,
      messageIdHeader: inbound.messageIdHeader,
      inReplyTo: inbound.inReplyTo,
      references: inbound.references,
      attachments: inbound.attachments,
    })

    // Redelivered webhook → nothing new to triage.
    if (!isNew) return

    await this.email.linkThreadVendor(weddingId, thread.id, inbound.fromAddress)

    const context = await this.email.buildTriageContext(weddingId, inbound.fromAddress)
    const result = await this.triage({
      fromAddress: inbound.fromAddress,
      fromName: inbound.fromName,
      subject: inbound.subject,
      text: inbound.text,
      html: inbound.html,
      attachments: inbound.attachments,
      context,
    })

    await this.email.persistTriage(message.id, weddingId, result)
    await this.email.applyThreadCategory(thread.id, result.category)

    const shouldForwardToCouple = result.suggestedActions.some(
      (a) => a.type === 'forward_to_couple'
    )
    let forwarded = false
    if (shouldForwardToCouple) {
      try {
        const outbound = await this.email.forwardInboundToCouple({
          weddingId,
          threadId: thread.id,
          inboxAddress: inbox.address,
          original: message,
          note: `Etta flagged this ${result.category.replace(/_/g, ' ')} for your review: ${result.summary}`,
        })
        forwarded = outbound !== null
      } catch (error) {
        // Non-fatal: the message + triage are already recorded.
        // biome-ignore lint/suspicious/noConsole: background handler error
        console.error('[inbound-email] forward failed', error)
      }
    }

    await this.email.createTriageNotification(weddingId, {
      threadId: thread.id,
      messageId: message.id,
      category: result.category,
      priority: result.priority,
      intent: result.intent,
      summary: result.summary,
      from: inbound.fromName ? `${inbound.fromName} <${inbound.fromAddress}>` : inbound.fromAddress,
      subject: inbound.subject,
      suggestedActions: result.suggestedActions.map((a) => a.type),
      forwardedToCouple: forwarded,
    })
  }
}
