/**
 * Telegram bot orchestration layer.
 *
 * Coordinates the messaging domain, blob storage, the session summariser, and
 * the Etta agent. Called from the Telegram webhook `after()` hook so every
 * handler run is fire-and-forget relative to the webhook response.
 *
 * Debounce model: each inbound message atomically bumps
 * `MessagingIdentity.pendingInvokeSeq` and schedules a delayed invoke. Only the
 * callback whose captured `seq` still matches the stored value actually runs
 * Etta — bursts collapse into a single turn.
 */

import type { ModelMessage } from 'ai'
import type { runEttaAgent } from '~/lib/etta/agent'
import type { TelegramClient } from '~/lib/telegram/client'
import type { TelegramDocument, TelegramMessage, TelegramUpdate } from '~/lib/telegram/types'
import type { SessionSummarizer } from '~/server/application/messaging/session-summarizer'
import type { MessagingService } from '~/server/domains/messaging/messaging.service'
import type { MessagingIdentity } from '~/server/domains/messaging/messaging.types'
import type { PutServerBlobArgs, PutServerBlobResult } from '~/server/infrastructure/storage'

const MAX_PDF_BYTES = 20 * 1024 * 1024
const DEFAULT_DEBOUNCE_MS = 4_000

export interface TelegramHandlerDeps {
  messaging: MessagingService
  tg: TelegramClient
  blob: (args: PutServerBlobArgs) => Promise<PutServerBlobResult>
  runEtta: typeof runEttaAgent
  summarizer: SessionSummarizer
  debounceMs?: number
  sleep?: (ms: number) => Promise<void>
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const sanitizeFilename = (name: string): string =>
  name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 120)

export class TelegramHandler {
  private readonly messaging: MessagingService
  private readonly tg: TelegramClient
  private readonly blob: (args: PutServerBlobArgs) => Promise<PutServerBlobResult>
  private readonly runEtta: typeof runEttaAgent
  private readonly summarizer: SessionSummarizer
  private readonly debounceMs: number
  private readonly sleep: (ms: number) => Promise<void>

  constructor(deps: TelegramHandlerDeps) {
    this.messaging = deps.messaging
    this.tg = deps.tg
    this.blob = deps.blob
    this.runEtta = deps.runEtta
    this.summarizer = deps.summarizer
    this.debounceMs = deps.debounceMs ?? DEFAULT_DEBOUNCE_MS
    this.sleep = deps.sleep ?? defaultSleep
  }

  async handle(update: TelegramUpdate): Promise<void> {
    const msg = update.message
    if (!msg) return
    if (msg.chat.type !== 'private') return

    if (typeof msg.text === 'string' && msg.text.startsWith('/start ')) {
      await this.handlePairing(msg)
      return
    }

    const found = await this.messaging.findWeddingForChat('telegram', String(msg.chat.id))
    if (!found) {
      await this.tg.sendMessage(
        msg.chat.id,
        'This chat is not linked yet. Pair it from OSWP → Settings → Connect Telegram.'
      )
      return
    }

    const ingested = await this.ingestMessage(found.identity, found.weddingId, msg)
    if (!ingested) return

    const seq = await this.messaging.bumpPendingInvokeSeq(found.identity.id)

    try {
      await this.tg.sendChatAction(msg.chat.id, 'typing')
    } catch {
      // non-fatal
    }

    await this.sleep(this.debounceMs)
    const current = await this.messaging.getPendingInvokeSeq(found.identity.id)
    if (current !== seq) return

    await this.summarizeOrphans(found.identity, found.weddingId)
    await this.invokeEtta(found.identity, found.weddingId, msg.chat.id)
  }

  private async handlePairing(msg: TelegramMessage): Promise<void> {
    const token = msg.text?.slice('/start '.length).trim()
    if (!token) {
      await this.tg.sendMessage(msg.chat.id, 'Missing pairing token.')
      return
    }

    try {
      await this.messaging.consumePairingToken({
        token,
        channel: 'telegram',
        externalChatId: String(msg.chat.id),
        externalUserId: msg.from?.id ? String(msg.from.id) : undefined,
        displayName:
          [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') ||
          msg.from?.username,
      })
      await this.tg.sendMessage(
        msg.chat.id,
        "You're linked. Ask me anything about your wedding, or forward a vendor quote PDF."
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to pair'
      await this.tg.sendMessage(msg.chat.id, `Pairing failed: ${message}`)
    }
  }

  private async ingestMessage(
    identity: MessagingIdentity,
    weddingId: string,
    msg: TelegramMessage
  ): Promise<boolean> {
    const externalMessageId = String(msg.message_id)

    if (msg.document) {
      const doc = msg.document
      const validation = this.validateDocument(doc)
      if (validation) {
        await this.tg.sendMessage(msg.chat.id, validation)
        return false
      }

      const file = await this.tg.getFile(doc.file_id)
      if (!file.file_path) {
        await this.tg.sendMessage(msg.chat.id, 'Could not download that attachment.')
        return false
      }

      const downloaded = await this.tg.downloadFile(file.file_path)
      const pathname = `telegram/${weddingId}/${Date.now()}-${sanitizeFilename(
        doc.file_name ?? 'attachment.pdf'
      )}`
      const uploaded = await this.blob({
        pathname,
        body: downloaded.buffer,
        contentType: 'application/pdf',
      })

      const caption = msg.caption?.trim() ?? ''
      const displayName = doc.file_name ?? 'attachment.pdf'
      const content = caption
        ? `${caption}\n\n[Attached PDF: ${displayName} at ${uploaded.url}]`
        : `[Attached PDF: ${displayName} at ${uploaded.url}]`

      await this.messaging.appendMessage({
        identityId: identity.id,
        weddingId,
        role: 'user',
        content,
        attachmentUrl: uploaded.url,
        attachmentName: displayName,
        externalMessageId,
      })
      return true
    }

    const text = msg.text?.trim()
    if (!text) return false

    await this.messaging.appendMessage({
      identityId: identity.id,
      weddingId,
      role: 'user',
      content: text,
      externalMessageId,
    })
    return true
  }

  private validateDocument(doc: TelegramDocument): string | null {
    const mime = doc.mime_type ?? ''
    const byName = (doc.file_name ?? '').toLowerCase().endsWith('.pdf')
    const isPdf = mime === 'application/pdf' || byName
    if (!isPdf) {
      return 'Only PDF attachments are supported right now.'
    }
    if (typeof doc.file_size === 'number' && doc.file_size > MAX_PDF_BYTES) {
      return 'That PDF is larger than 20 MB. Please send a smaller file.'
    }
    return null
  }

  private async summarizeOrphans(identity: MessagingIdentity, weddingId: string): Promise<void> {
    const groups = await this.messaging.findOrphanBlocks(identity.id)
    if (groups.length === 0) return
    const authz = await this.messaging.resolveAuthzForIdentity(identity)
    for (const group of groups) {
      try {
        await this.summarizer.summarizeSession(group, { weddingId, authz })
      } catch {
        // swallow — cron backstop will retry
      }
    }
  }

  private async invokeEtta(
    identity: MessagingIdentity,
    weddingId: string,
    chatId: number
  ): Promise<void> {
    const buffer = await this.messaging.loadConversation(identity.id)
    const messages: ModelMessage[] = buffer.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
    if (messages.length === 0) return

    const authz = await this.messaging.resolveAuthzForIdentity(identity)
    const result = await this.runEtta({
      actor: 'couple-bot',
      weddingId,
      authz,
      messages,
    })
    const text = await result.text

    if (text.trim().length === 0) return

    await this.tg.sendMessage(chatId, text)
    await this.messaging.appendMessage({
      identityId: identity.id,
      weddingId,
      role: 'assistant',
      content: text,
    })
  }
}
