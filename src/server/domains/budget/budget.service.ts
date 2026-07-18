/**
 * Budget Domain - Service
 *
 * Business logic for the Budget domain: target budget, per-section budgets,
 * actual spend, and refundable deposit tracking. Handles permission checks,
 * ownership verification, and derived total computation.
 */

import { TRPCError } from '@trpc/server'

import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { BudgetRepository } from '~/server/domains/budget/budget.repository'
import type {
  BudgetCategoryWithExpenses,
  BudgetExpense,
  BudgetOverview,
  BudgetSummary,
  BudgetTotals,
} from '~/server/domains/budget/budget.types'
import type {
  CreateCategoryInput,
  CreateExpenseInput,
  UpdateCategoryInput,
  UpdateExpenseInput,
} from '~/server/domains/budget/budget.validator'

export class BudgetService {
  constructor(private repository: BudgetRepository) {}

  // ─── Overview ─────────────────────────────────────────────────────────────────

  /**
   * Build the full budgeting overview: target, per-category rows with derived
   * totals, and a wedding-wide summary.
   */
  async getOverview(ctx: AuthzContext, weddingId: string): Promise<BudgetOverview> {
    this.requireBudgetPermission(ctx, 'read')

    const [targetTotal, categories] = await Promise.all([
      this.repository.getTargetTotal(weddingId),
      this.repository.findCategoriesWithExpenses(weddingId),
    ])

    const categoriesWithTotals = categories.map((category) => ({
      ...category,
      totals: this.computeTotals(category.plannedAmount, category.expenses),
    }))

    return {
      targetTotal,
      categories: categoriesWithTotals,
      summary: this.computeSummary(targetTotal, categoriesWithTotals),
    }
  }

  // ─── Target budget ──────────────────────────────────────────────────────────

  async setTarget(ctx: AuthzContext, weddingId: string, targetTotal: number): Promise<number> {
    this.requireBudgetPermission(ctx, 'update')
    return this.repository.setTargetTotal(weddingId, targetTotal)
  }

  // ─── Categories ───────────────────────────────────────────────────────────────

  async createCategory(
    ctx: AuthzContext,
    weddingId: string,
    input: CreateCategoryInput
  ): Promise<BudgetCategoryWithExpenses> {
    this.requireBudgetPermission(ctx, 'create')
    const position = await this.repository.nextCategoryPosition(weddingId)
    const category = await this.repository.createCategory({
      weddingId,
      name: input.name,
      plannedAmount: input.plannedAmount ?? 0,
      position,
    })
    return { ...category, totals: this.computeTotals(category.plannedAmount, category.expenses) }
  }

  async updateCategory(
    ctx: AuthzContext,
    weddingId: string,
    input: UpdateCategoryInput
  ): Promise<BudgetCategoryWithExpenses> {
    this.requireBudgetPermission(ctx, 'update')
    await this.assertCategoryOwnership(input.categoryId, weddingId)
    const category = await this.repository.updateCategory(input.categoryId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.plannedAmount !== undefined ? { plannedAmount: input.plannedAmount } : {}),
    })
    return { ...category, totals: this.computeTotals(category.plannedAmount, category.expenses) }
  }

  async deleteCategory(ctx: AuthzContext, weddingId: string, categoryId: string): Promise<void> {
    this.requireBudgetPermission(ctx, 'delete')
    await this.assertCategoryOwnership(categoryId, weddingId)
    await this.repository.deleteCategory(categoryId)
  }

  // ─── Expenses ─────────────────────────────────────────────────────────────────

  async createExpense(
    ctx: AuthzContext,
    weddingId: string,
    input: CreateExpenseInput
  ): Promise<BudgetExpense> {
    this.requireBudgetPermission(ctx, 'create')
    await this.assertCategoryOwnership(input.categoryId, weddingId)
    return this.repository.createExpense({
      weddingId,
      categoryId: input.categoryId,
      description: input.description,
      amount: input.amount,
      isDeposit: input.isDeposit ?? false,
      isRefundable: input.isRefundable ?? false,
      refundedAt: input.refundedAt ?? null,
      paidAt: input.paidAt ?? null,
      notes: input.notes ?? null,
    })
  }

  async updateExpense(
    ctx: AuthzContext,
    weddingId: string,
    input: UpdateExpenseInput
  ): Promise<BudgetExpense> {
    this.requireBudgetPermission(ctx, 'update')
    await this.assertExpenseOwnership(input.expenseId, weddingId)
    const { expenseId, ...rest } = input
    return this.repository.updateExpense(expenseId, rest)
  }

  async deleteExpense(ctx: AuthzContext, weddingId: string, expenseId: string): Promise<void> {
    this.requireBudgetPermission(ctx, 'delete')
    await this.assertExpenseOwnership(expenseId, weddingId)
    await this.repository.deleteExpense(expenseId)
  }

  // ─── Derived totals ────────────────────────────────────────────────────────────

  private computeTotals(plannedAmount: number, expenses: BudgetExpense[]): BudgetTotals {
    let actualSpend = 0
    let refundableDeposits = 0
    let outstandingDeposits = 0

    for (const expense of expenses) {
      actualSpend += expense.amount
      if (expense.isRefundable) {
        refundableDeposits += expense.amount
        if (!expense.refundedAt) {
          outstandingDeposits += expense.amount
        }
      }
    }

    const netSpend = actualSpend - refundableDeposits

    return {
      plannedAmount,
      actualSpend: round2(actualSpend),
      refundableDeposits: round2(refundableDeposits),
      outstandingDeposits: round2(outstandingDeposits),
      netSpend: round2(netSpend),
      remaining: round2(plannedAmount - netSpend),
    }
  }

  private computeSummary(
    targetTotal: number,
    categories: BudgetCategoryWithExpenses[]
  ): BudgetSummary {
    const summary = categories.reduce(
      (acc, category) => {
        acc.totalPlanned += category.totals.plannedAmount
        acc.actualSpend += category.totals.actualSpend
        acc.refundableDeposits += category.totals.refundableDeposits
        acc.outstandingDeposits += category.totals.outstandingDeposits
        acc.netSpend += category.totals.netSpend
        return acc
      },
      {
        totalPlanned: 0,
        actualSpend: 0,
        refundableDeposits: 0,
        outstandingDeposits: 0,
        netSpend: 0,
      }
    )

    return {
      targetTotal,
      totalPlanned: round2(summary.totalPlanned),
      actualSpend: round2(summary.actualSpend),
      refundableDeposits: round2(summary.refundableDeposits),
      outstandingDeposits: round2(summary.outstandingDeposits),
      netSpend: round2(summary.netSpend),
      remaining: round2(targetTotal - summary.netSpend),
    }
  }

  // ─── Ownership + permissions ────────────────────────────────────────────────────

  private async assertCategoryOwnership(categoryId: string, weddingId: string): Promise<void> {
    const category = await this.repository.findCategoryById(categoryId)
    if (!category) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Budget category not found' })
    }
    if (category.weddingId !== weddingId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this budget category',
      })
    }
  }

  private async assertExpenseOwnership(expenseId: string, weddingId: string): Promise<void> {
    const expense = await this.repository.findExpenseById(expenseId)
    if (!expense) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Budget expense not found' })
    }
    if (expense.weddingId !== weddingId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this budget expense',
      })
    }
  }

  private requireBudgetPermission(
    ctx: AuthzContext,
    action: 'read' | 'create' | 'update' | 'delete'
  ): void {
    requirePermission(ctx, { budget: [action] })
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
