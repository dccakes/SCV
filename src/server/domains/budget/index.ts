/**
 * Budget Domain - Barrel Export
 *
 * Exports all budget domain components for use throughout the application.
 */

import { BudgetRepository } from '~/server/domains/budget/budget.repository'
import { BudgetService } from '~/server/domains/budget/budget.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances
const budgetRepository = new BudgetRepository(db)
export const budgetService = new BudgetService(budgetRepository)

// Export classes for testing/DI
export { BudgetRepository } from '~/server/domains/budget/budget.repository'
export { BudgetService } from '~/server/domains/budget/budget.service'
// Export types
export type {
  BudgetCategoryWithExpenses,
  BudgetExpense,
  BudgetOverview,
  BudgetSummary,
  BudgetTotals,
} from '~/server/domains/budget/budget.types'
// Export validators
export {
  type CreateCategoryInput,
  type CreateExpenseInput,
  createCategorySchema,
  createExpenseSchema,
  type DeleteCategoryInput,
  type DeleteExpenseInput,
  deleteCategorySchema,
  deleteExpenseSchema,
  type SetTargetInput,
  setTargetSchema,
  type UpdateCategoryInput,
  type UpdateExpenseInput,
  updateCategorySchema,
  updateExpenseSchema,
} from '~/server/domains/budget/budget.validator'
