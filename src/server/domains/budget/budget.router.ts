/**
 * Budget Domain - Router
 *
 * tRPC router for budgeting endpoints. All endpoints are protected —
 * budget data is private to the couple's workspace.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { budgetService } from '~/server/domains/budget'
import {
  createCategorySchema,
  createExpenseSchema,
  deleteCategorySchema,
  deleteExpenseSchema,
  setCurrencySchema,
  setTargetSchema,
  updateCategorySchema,
  updateExpenseSchema,
} from '~/server/domains/budget/budget.validator'

export const budgetRouter = createTRPCRouter({
  /**
   * Full budgeting overview: target, per-section rows with derived totals,
   * and a wedding-wide summary.
   */
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return budgetService.getOverview(ctx.authz, weddingId)
  }),

  /**
   * Set the overall target budget for the wedding.
   */
  setTarget: protectedProcedure.input(setTargetSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return budgetService.setTarget(ctx.authz, weddingId, input.targetTotal)
  }),

  /**
   * Set the currency the whole budget is tracked in (no conversion performed).
   */
  setCurrency: protectedProcedure.input(setCurrencySchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return budgetService.setCurrency(ctx.authz, weddingId, input.currency)
  }),

  /**
   * Create a new budget section (category).
   */
  createCategory: protectedProcedure
    .input(createCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return budgetService.createCategory(ctx.authz, weddingId, input)
    }),

  /**
   * Update a section's name or planned amount.
   */
  updateCategory: protectedProcedure
    .input(updateCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return budgetService.updateCategory(ctx.authz, weddingId, input)
    }),

  /**
   * Delete a section (and its expenses).
   */
  deleteCategory: protectedProcedure
    .input(deleteCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      await budgetService.deleteCategory(ctx.authz, weddingId, input.categoryId)
      return { success: true }
    }),

  /**
   * Add an actual spend line item to a section.
   */
  createExpense: protectedProcedure.input(createExpenseSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return budgetService.createExpense(ctx.authz, weddingId, input)
  }),

  /**
   * Update an expense (amount, deposit/refund flags, etc.).
   */
  updateExpense: protectedProcedure.input(updateExpenseSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return budgetService.updateExpense(ctx.authz, weddingId, input)
  }),

  /**
   * Delete an expense.
   */
  deleteExpense: protectedProcedure.input(deleteExpenseSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    await budgetService.deleteExpense(ctx.authz, weddingId, input.expenseId)
    return { success: true }
  }),
})
