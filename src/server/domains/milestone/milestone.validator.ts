import { z } from 'zod'

export const getMilestonesSchema = z.object({})

export const milestoneIdSchema = z.object({
  milestoneId: z.string().min(1, 'Milestone ID is required'),
})

export const getMilestoneSchema = milestoneIdSchema

export const milestoneOverrideSchema = milestoneIdSchema.extend({
  userOverrideStatus: z.enum(['attested', 'dismissed']),
})

export type GetMilestonesInput = z.infer<typeof getMilestonesSchema>
export type MilestoneIdInput = z.infer<typeof milestoneIdSchema>
export type GetMilestoneInput = z.infer<typeof getMilestoneSchema>
export type MilestoneOverrideInput = z.infer<typeof milestoneOverrideSchema>
