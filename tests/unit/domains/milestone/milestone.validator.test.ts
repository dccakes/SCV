import {
  getMilestoneSchema,
  getMilestonesSchema,
  milestoneIdSchema,
  milestoneOverrideSchema,
} from '~/server/domains/milestone/milestone.validator'

describe('getMilestonesSchema', () => {
  it('accepts an empty object', () => {
    const result = getMilestonesSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

describe('milestoneIdSchema', () => {
  it('accepts a valid milestone id', () => {
    const result = milestoneIdSchema.safeParse({ milestoneId: 'milestone-123' })
    expect(result.success).toBe(true)
  })

  it('rejects a missing milestone id', () => {
    const result = milestoneIdSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('getMilestoneSchema', () => {
  it('matches the milestone id shape', () => {
    const result = getMilestoneSchema.safeParse({ milestoneId: 'milestone-123' })
    expect(result.success).toBe(true)
  })
})

describe('milestoneOverrideSchema', () => {
  it('accepts all valid override statuses', () => {
    for (const status of ['attested', 'dismissed'] as const) {
      const result = milestoneOverrideSchema.safeParse({
        milestoneId: 'milestone-123',
        userOverrideStatus: status,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid override statuses', () => {
    const result = milestoneOverrideSchema.safeParse({
      milestoneId: 'milestone-123',
      userOverrideStatus: 'done',
    })
    expect(result.success).toBe(false)
  })
})
