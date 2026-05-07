/**
 * End-of-session memory writer.
 *
 * Before answering a new inbound on a session-boundary, we run a lightweight
 * Etta pass with the memory-only toolset over any "orphan" messages (rows with
 * `summarizedAt IS NULL` outside the current session window). A Vercel Cron
 * hits `sweepStale` every 30 minutes to cover users who go silent.
 */

import type { ModelMessage } from 'ai'
import type { runEttaAgent } from '~/lib/etta/agent'
import type { AuthzContext } from '~/server/authz/authorization.types'
import type { MessagingService } from '~/server/domains/messaging/messaging.service'
import type { ChatMessage } from '~/server/domains/messaging/messaging.types'

export interface SessionSummarizerDeps {
  messaging: MessagingService
  runEtta: typeof runEttaAgent
}

export interface SweepOptions {
  olderThanMs: number
  maxIdentities?: number
}

export class SessionSummarizer {
  constructor(private readonly deps: SessionSummarizerDeps) {}

  async summarizeSession(
    block: ChatMessage[],
    opts: { weddingId: string; authz: AuthzContext }
  ): Promise<void> {
    if (block.length === 0) return

    const messages: ModelMessage[] = block.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const result = await this.deps.runEtta({
      actor: 'couple-bot',
      weddingId: opts.weddingId,
      authz: opts.authz,
      messages,
      toolsetMode: 'memory-only',
    })
    await result.text

    await this.deps.messaging.markSummarized(block.map((m) => m.id))
  }

  async sweepStale(opts: SweepOptions): Promise<number> {
    const maxIdentities = opts.maxIdentities ?? 20
    const identities = await this.deps.messaging.findIdentitiesWithUnsummarized(
      opts.olderThanMs,
      maxIdentities
    )

    let summarized = 0
    for (const identity of identities) {
      const groups = await this.deps.messaging.findOrphanBlocks(identity.id, {
        sessionGapMs: opts.olderThanMs,
      })
      for (const group of groups) {
        try {
          await this.summarizeSession(group, {
            weddingId: identity.weddingId,
            authz: { userId: identity.linkedByUserId, activeOrganization: null },
          })
          summarized++
        } catch {
          // leave messages unmarked; retry on the next sweep
        }
      }
    }
    return summarized
  }
}
