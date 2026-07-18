/**
 * Budget Domain - Repository
 *
 * Database operations for the Budget, BudgetCategory, and BudgetExpense entities.
 * Decimal columns are serialized to plain numbers at this boundary.
 */

import type {
  Budget as PrismaBudget,
  BudgetCategory as PrismaBudgetCategory,
  BudgetExpense as PrismaBudgetExpense,
  PrismaClient,
} from '@prisma/client'

import type {
  BudgetCategoryWithExpenses,
  BudgetExpense,
} from '~/server/domains/budget/budget.types'

type PrismaCategoryWithExpenses = PrismaBudgetCategory & {
  expenses: PrismaBudgetExpense[]
}

export class BudgetRepository {
  constructor(private db: PrismaClient) {}

  // ─── Target budget ──────────────────────────────────────────────────────────

  /**
   * Get the target total for a wedding, creating a default Budget row lazily.
   */
  async getTargetTotal(weddingId: string): Promise<number> {
    const budget = await this.db.budget.findUnique({ where: { weddingId } })
    return budget ? this.toNumber(budget.targetTotal) : 0
  }

  /**
   * Set the overall target budget for a wedding (upserts the singleton row).
   */
  async setTargetTotal(weddingId: string, targetTotal: number): Promise<number> {
    const budget = await this.db.budget.upsert({
      where: { weddingId },
      create: { weddingId, targetTotal },
      update: { targetTotal },
    })
    return this.toNumber(budget.targetTotal)
  }

  // ─── Categories ───────────────────────────────────────────────────────────────

  /**
   * Fetch every category for a wedding with its expenses, ordered for display.
   */
  async findCategoriesWithExpenses(weddingId: string): Promise<BudgetCategoryWithExpenses[]> {
    const rows = await this.db.budgetCategory.findMany({
      where: { weddingId },
      include: { expenses: { orderBy: { createdAt: 'asc' } } },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    })
    return rows.map((row) => this.serializeCategory(row))
  }

  async findCategoryById(id: string): Promise<{ id: string; weddingId: string } | null> {
    return this.db.budgetCategory.findUnique({
      where: { id },
      select: { id: true, weddingId: true },
    })
  }

  async nextCategoryPosition(weddingId: string): Promise<number> {
    const last = await this.db.budgetCategory.findFirst({
      where: { weddingId },
      orderBy: { position: 'desc' },
      select: { position: true },
    })
    return last ? last.position + 1 : 0
  }

  async createCategory(data: {
    weddingId: string
    name: string
    plannedAmount: number
    position: number
  }): Promise<BudgetCategoryWithExpenses> {
    const row = await this.db.budgetCategory.create({
      data,
      include: { expenses: { orderBy: { createdAt: 'asc' } } },
    })
    return this.serializeCategory(row)
  }

  async updateCategory(
    id: string,
    data: { name?: string; plannedAmount?: number }
  ): Promise<BudgetCategoryWithExpenses> {
    const row = await this.db.budgetCategory.update({
      where: { id },
      data,
      include: { expenses: { orderBy: { createdAt: 'asc' } } },
    })
    return this.serializeCategory(row)
  }

  async deleteCategory(id: string): Promise<void> {
    await this.db.budgetCategory.delete({ where: { id } })
  }

  // ─── Expenses ─────────────────────────────────────────────────────────────────

  async findExpenseById(id: string): Promise<{ id: string; weddingId: string } | null> {
    return this.db.budgetExpense.findUnique({
      where: { id },
      select: { id: true, weddingId: true },
    })
  }

  async createExpense(data: {
    weddingId: string
    categoryId: string
    description: string
    amount: number
    isDeposit: boolean
    isRefundable: boolean
    refundedAt: Date | null
    paidAt: Date | null
    notes: string | null
  }): Promise<BudgetExpense> {
    const row = await this.db.budgetExpense.create({ data })
    return this.serializeExpense(row)
  }

  async updateExpense(
    id: string,
    data: {
      description?: string
      amount?: number
      isDeposit?: boolean
      isRefundable?: boolean
      refundedAt?: Date | null
      paidAt?: Date | null
      notes?: string | null
    }
  ): Promise<BudgetExpense> {
    const row = await this.db.budgetExpense.update({ where: { id }, data })
    return this.serializeExpense(row)
  }

  async deleteExpense(id: string): Promise<void> {
    await this.db.budgetExpense.delete({ where: { id } })
  }

  // ─── Serialization ────────────────────────────────────────────────────────────

  private serializeCategory(row: PrismaCategoryWithExpenses): BudgetCategoryWithExpenses {
    return {
      id: row.id,
      weddingId: row.weddingId,
      name: row.name,
      plannedAmount: this.toNumber(row.plannedAmount),
      position: row.position,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      expenses: row.expenses.map((expense) => this.serializeExpense(expense)),
      // Totals are computed by the service so this stays a pure data mapper.
      totals: {
        plannedAmount: this.toNumber(row.plannedAmount),
        actualSpend: 0,
        refundableDeposits: 0,
        outstandingDeposits: 0,
        netSpend: 0,
        remaining: 0,
      },
    }
  }

  private serializeExpense(row: PrismaBudgetExpense): BudgetExpense {
    return {
      id: row.id,
      weddingId: row.weddingId,
      categoryId: row.categoryId,
      description: row.description,
      amount: this.toNumber(row.amount),
      isDeposit: row.isDeposit,
      isRefundable: row.isRefundable,
      refundedAt: row.refundedAt,
      paidAt: row.paidAt,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }

  private toNumber(value: PrismaBudget['targetTotal']): number {
    return Number.parseFloat(value.toString())
  }
}
