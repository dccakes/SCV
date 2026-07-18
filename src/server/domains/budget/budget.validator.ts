/**
 * Budget Domain - Validators
 *
 * Zod schemas for validating budget-related inputs.
 * These are the single source of truth for input types.
 */

import { z } from 'zod'

export const MAX_BUDGET_AMOUNT = 100_000_000
export const MAX_BUDGET_DESCRIPTION_LENGTH = 200
export const MAX_BUDGET_CATEGORY_NAME_LENGTH = 100
export const MAX_BUDGET_NOTES_LENGTH = 2000

const moneySchema = z
  .number({ message: 'Amount must be a number' })
  .min(0, 'Amount cannot be negative')
  .max(MAX_BUDGET_AMOUNT, 'Amount is too large')
  .refine((value) => Number.isFinite(value), 'Amount must be a valid number')

// ─── Target budget ──────────────────────────────────────────────────────────

export const setTargetSchema = z.object({
  targetTotal: moneySchema,
})

// ─── Categories ───────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required')
    .max(MAX_BUDGET_CATEGORY_NAME_LENGTH, 'Name is too long'),
  plannedAmount: moneySchema.optional(),
})

export const updateCategorySchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required')
    .max(MAX_BUDGET_CATEGORY_NAME_LENGTH, 'Name is too long')
    .optional(),
  plannedAmount: moneySchema.optional(),
})

export const deleteCategorySchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
})

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(MAX_BUDGET_DESCRIPTION_LENGTH, 'Description is too long'),
  amount: moneySchema,
  isDeposit: z.boolean().optional(),
  isRefundable: z.boolean().optional(),
  refundedAt: z.coerce.date().nullable().optional(),
  paidAt: z.coerce.date().nullable().optional(),
  notes: z.string().trim().max(MAX_BUDGET_NOTES_LENGTH, 'Notes are too long').nullable().optional(),
})

export const updateExpenseSchema = z.object({
  expenseId: z.string().min(1, 'Expense ID is required'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(MAX_BUDGET_DESCRIPTION_LENGTH, 'Description is too long')
    .optional(),
  amount: moneySchema.optional(),
  isDeposit: z.boolean().optional(),
  isRefundable: z.boolean().optional(),
  refundedAt: z.coerce.date().nullable().optional(),
  paidAt: z.coerce.date().nullable().optional(),
  notes: z.string().trim().max(MAX_BUDGET_NOTES_LENGTH, 'Notes are too long').nullable().optional(),
})

export const deleteExpenseSchema = z.object({
  expenseId: z.string().min(1, 'Expense ID is required'),
})

export type SetTargetInput = z.infer<typeof setTargetSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
export type DeleteExpenseInput = z.infer<typeof deleteExpenseSchema>
