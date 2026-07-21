/**
 * Budget Domain - Types
 *
 * Serialized (Decimal → number) shapes returned by the budget domain.
 * These are the source of truth for budget data throughout the app.
 */

export type BudgetExpense = {
  id: string
  weddingId: string
  categoryId: string
  description: string
  amount: number
  isDeposit: boolean
  isRefundable: boolean
  refundedAt: Date | null
  paidAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Derived totals for a single category (or the whole budget when aggregated).
 */
export type BudgetTotals = {
  /** Planned/target budget for the section */
  plannedAmount: number
  /** Gross money paid out (sum of every expense amount) */
  actualSpend: number
  /** All refundable deposits, expected back after the event (refunded or not) */
  refundableDeposits: number
  /** Refundable deposits still outstanding (not yet returned) */
  outstandingDeposits: number
  /** True cost after subtracting money that comes back: actualSpend - refundableDeposits */
  netSpend: number
  /** plannedAmount - netSpend (negative means over the section budget) */
  remaining: number
}

/** Raw category data as returned by the repository (no derived totals). */
export type BudgetCategoryData = {
  id: string
  weddingId: string
  name: string
  plannedAmount: number
  position: number
  createdAt: Date
  updatedAt: Date
  expenses: BudgetExpense[]
}

/** Category enriched with derived totals by the service. */
export type BudgetCategoryWithExpenses = BudgetCategoryData & {
  totals: BudgetTotals
}

export type BudgetSummary = {
  /** Overall target budget for the whole wedding */
  targetTotal: number
  /** Sum of every category's planned amount */
  totalPlanned: number
  actualSpend: number
  refundableDeposits: number
  outstandingDeposits: number
  netSpend: number
  /** targetTotal - netSpend (negative means projected to go over budget) */
  remaining: number
}

export type BudgetOverview = {
  targetTotal: number
  categories: BudgetCategoryWithExpenses[]
  summary: BudgetSummary
}
