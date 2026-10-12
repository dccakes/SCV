/**
 * Messaging Domain - Validators
 */

import { z } from 'zod'

export const createPairingTokenSchema = z.object({
  channel: z.literal('telegram'),
})

export const revokeIdentitySchema = z.object({
  identityId: z.string().min(1, 'Identity ID is required'),
})

export const getConversationSchema = z.object({
  identityId: z.string().min(1, 'Identity ID is required'),
})

export const sendHouseholdMessageSchema = z.object({
  householdId: z.string().min(1, 'Household ID is required'),
  message: z.string().trim().min(1, 'Message is required').max(1600),
})

export const broadcastUpdateSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(1600),
})

export type CreatePairingTokenInput = z.infer<typeof createPairingTokenSchema>
export type RevokeIdentityInput = z.infer<typeof revokeIdentitySchema>
export type GetConversationInput = z.infer<typeof getConversationSchema>
export type SendHouseholdMessageInput = z.infer<typeof sendHouseholdMessageSchema>
export type BroadcastUpdateInput = z.infer<typeof broadcastUpdateSchema>
