/**
 * Gmail Domain - Validators
 *
 * Zod schemas for Gmail integration endpoints.
 */

import { z } from 'zod'

export const gmailCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
})
export type GmailCallbackInput = z.infer<typeof gmailCallbackSchema>

export const gmailListMessagesSchema = z.object({
  query: z.string().optional(),
  maxResults: z.number().int().min(1).max(50).default(20),
  pageToken: z.string().optional(),
})
export type GmailListMessagesInput = z.infer<typeof gmailListMessagesSchema>

export const gmailGetThreadSchema = z.object({
  threadId: z.string().min(1),
})
export type GmailGetThreadInput = z.infer<typeof gmailGetThreadSchema>

export const gmailCreateDraftSchema = z.object({
  threadId: z.string().min(1),
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  inReplyTo: z.string().optional(),
})
export type GmailCreateDraftInput = z.infer<typeof gmailCreateDraftSchema>
