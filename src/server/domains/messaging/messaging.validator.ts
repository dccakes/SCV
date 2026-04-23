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

export type CreatePairingTokenInput = z.infer<typeof createPairingTokenSchema>
export type RevokeIdentityInput = z.infer<typeof revokeIdentitySchema>
