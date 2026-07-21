/**
 * Tests for Budget Domain Validators
 */

import {
  createCategorySchema,
  createExpenseSchema,
  setCurrencySchema,
  setTargetSchema,
  updateExpenseSchema,
} from '~/server/domains/budget/budget.validator'

describe('setTargetSchema', () => {
  it('accepts a non-negative amount', () => {
    expect(setTargetSchema.safeParse({ targetTotal: 25000 }).success).toBe(true)
    expect(setTargetSchema.safeParse({ targetTotal: 0 }).success).toBe(true)
  })

  it('rejects negative amounts', () => {
    expect(setTargetSchema.safeParse({ targetTotal: -1 }).success).toBe(false)
  })
})

describe('setCurrencySchema', () => {
  it('accepts supported currencies', () => {
    expect(setCurrencySchema.safeParse({ currency: 'USD' }).success).toBe(true)
    expect(setCurrencySchema.safeParse({ currency: 'GBP' }).success).toBe(true)
  })

  it('rejects unsupported currencies', () => {
    expect(setCurrencySchema.safeParse({ currency: 'EUR' }).success).toBe(false)
    expect(setCurrencySchema.safeParse({ currency: 'usd' }).success).toBe(false)
  })
})

describe('createCategorySchema', () => {
  it('requires a name and trims it', () => {
    const result = createCategorySchema.safeParse({ name: '  Venue  ', plannedAmount: 5000 })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.name).toBe('Venue')
  })

  it('rejects an empty name', () => {
    expect(createCategorySchema.safeParse({ name: '   ' }).success).toBe(false)
  })

  it('allows omitting the planned amount', () => {
    expect(createCategorySchema.safeParse({ name: 'Attire' }).success).toBe(true)
  })
})

describe('createExpenseSchema', () => {
  it('accepts a full deposit expense', () => {
    const result = createExpenseSchema.safeParse({
      categoryId: 'category-1',
      description: 'Venue deposit',
      amount: 2000,
      isDeposit: true,
      isRefundable: true,
      refundedAt: null,
      paidAt: '2026-05-01',
      notes: 'Returned two weeks after the event',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.paidAt).toBeInstanceOf(Date)
    }
  })

  it('requires a description and amount', () => {
    expect(
      createExpenseSchema.safeParse({ categoryId: 'category-1', description: '', amount: 10 })
        .success
    ).toBe(false)
    expect(
      createExpenseSchema.safeParse({ categoryId: 'category-1', description: 'x', amount: -5 })
        .success
    ).toBe(false)
  })

  it('coerces a date string for refundedAt', () => {
    const result = createExpenseSchema.safeParse({
      categoryId: 'category-1',
      description: 'Deposit',
      amount: 500,
      refundedAt: '2026-07-01',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.refundedAt).toBeInstanceOf(Date)
  })
})

describe('updateExpenseSchema', () => {
  it('requires the expense id', () => {
    expect(updateExpenseSchema.safeParse({ amount: 10 }).success).toBe(false)
    expect(updateExpenseSchema.safeParse({ expenseId: 'e1', amount: 10 }).success).toBe(true)
  })
})
