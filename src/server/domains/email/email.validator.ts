/**
 * Email Domain - Validators
 */

import { z } from 'zod'

export const getThreadSchema = z.object({
  threadId: z.string().min(1),
})
export type GetThreadInput = z.infer<typeof getThreadSchema>

export const sendReplySchema = z.object({
  threadId: z.string().min(1),
  body: z.string().min(1).max(50_000),
  subject: z.string().min(1).max(500).optional(),
})
export type SendReplyInput = z.infer<typeof sendReplySchema>
