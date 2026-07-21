/**
 * Tests for Budget Domain Service
 *
 * Focus areas:
 * - Derived totals (actual spend, refundable deposits, net spend, remaining)
 * - Deposit / refund handling
 * - Ownership + permission enforcement
 */

import { TRPCError } from '@trpc/server'

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

import { requirePermission } from '~/server/authz/permission-checker'
import type { BudgetRepository } from '~/server/domains/budget/budget.repository'
import { BudgetService } from '~/server/domains/budget/budget.service'
import type {
  BudgetCategoryWithExpenses,
  BudgetExpense,
} from '~/server/domains/budget/budget.types'

const mockRequirePermission = requirePermission as jest.Mock

const WEDDING_ID = 'wedding-1'
const OTHER_WEDDING_ID = 'wedding-2'

const emptyTotals = {
  plannedAmount: 0,
  actualSpend: 0,
  refundableDeposits: 0,
  outstandingDeposits: 0,
  netSpend: 0,
  remaining: 0,
}

function makeExpense(overrides: Partial<BudgetExpense>): BudgetExpense {
  return {
    id: overrides.id ?? 'expense-1',
    weddingId: WEDDING_ID,
    categoryId: 'category-1',
    description: 'Test expense',
    amount: 0,
    isDeposit: false,
    isRefundable: false,
    refundedAt: null,
    paidAt: null,
    notes: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

function makeCategory(overrides: Partial<BudgetCategoryWithExpenses>): BudgetCategoryWithExpenses {
  return {
    id: overrides.id ?? 'category-1',
    weddingId: WEDDING_ID,
    name: 'Venue',
    plannedAmount: 0,
    position: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    expenses: [],
    totals: emptyTotals,
    ...overrides,
  }
}

function createService(overrides: Partial<BudgetRepository> = {}) {
  const repository = {
    getSettings: jest.fn(),
    setTargetTotal: jest.fn(),
    setCurrency: jest.fn(),
    findCategoriesWithExpenses: jest.fn(),
    findCategoryById: jest.fn(),
    nextCategoryPosition: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    findExpenseById: jest.fn(),
    createExpense: jest.fn(),
    updateExpense: jest.fn(),
    deleteExpense: jest.fn(),
    ...overrides,
  } as unknown as jest.Mocked<BudgetRepository>

  const service = new BudgetService(repository)
  return { service, repository }
}

const ctx = { userId: 'user-1', activeOrganization: { organizationId: 'org-1', role: 'owner' } }

beforeEach(() => {
  jest.clearAllMocks()
  mockRequirePermission.mockReturnValue({ organizationId: 'org-1', role: 'owner' })
})

describe('BudgetService.getOverview', () => {
  it('computes actual spend, refundable deposits, net spend and remaining', async () => {
    const category = makeCategory({
      plannedAmount: 10000,
      expenses: [
        makeExpense({ id: 'e1', amount: 6000 }),
        makeExpense({ id: 'e2', amount: 2000, isDeposit: true, isRefundable: true }),
        makeExpense({ id: 'e3', amount: 500, isDeposit: true, isRefundable: false }),
      ],
    })

    const { service } = createService({
      getSettings: jest.fn().mockResolvedValue({ targetTotal: 20000, currency: 'USD' }),
      findCategoriesWithExpenses: jest.fn().mockResolvedValue([category]),
    })

    const overview = await service.getOverview(ctx, WEDDING_ID)

    expect(overview.currency).toBe('USD')
    const totals = overview.categories[0].totals
    expect(totals.actualSpend).toBe(8500)
    expect(totals.refundableDeposits).toBe(2000)
    expect(totals.outstandingDeposits).toBe(2000) // not refunded yet
    expect(totals.netSpend).toBe(6500) // 8500 - 2000 refundable
    expect(totals.remaining).toBe(3500) // 10000 planned - 6500 net

    expect(overview.summary.targetTotal).toBe(20000)
    expect(overview.summary.actualSpend).toBe(8500)
    expect(overview.summary.netSpend).toBe(6500)
    expect(overview.summary.remaining).toBe(13500) // 20000 - 6500
  })

  it('treats a received refund as no longer outstanding but still excluded from net spend', async () => {
    const category = makeCategory({
      plannedAmount: 5000,
      expenses: [
        makeExpense({
          id: 'e1',
          amount: 1000,
          isDeposit: true,
          isRefundable: true,
          refundedAt: new Date('2026-06-01'),
        }),
      ],
    })

    const { service } = createService({
      getSettings: jest.fn().mockResolvedValue({ targetTotal: 0, currency: 'GBP' }),
      findCategoriesWithExpenses: jest.fn().mockResolvedValue([category]),
    })

    const { totals } = (await service.getOverview(ctx, WEDDING_ID)).categories[0]
    expect(totals.actualSpend).toBe(1000)
    expect(totals.refundableDeposits).toBe(1000)
    expect(totals.outstandingDeposits).toBe(0) // refund received
    expect(totals.netSpend).toBe(0) // refundable money excluded
  })

  it('aggregates totals across multiple categories', async () => {
    const categories = [
      makeCategory({
        id: 'c1',
        plannedAmount: 1000,
        expenses: [makeExpense({ id: 'e1', amount: 400 })],
      }),
      makeCategory({
        id: 'c2',
        plannedAmount: 2000,
        expenses: [makeExpense({ id: 'e2', amount: 1500 })],
      }),
    ]

    const { service } = createService({
      getSettings: jest.fn().mockResolvedValue({ targetTotal: 5000, currency: 'USD' }),
      findCategoriesWithExpenses: jest.fn().mockResolvedValue(categories),
    })

    const { summary } = await service.getOverview(ctx, WEDDING_ID)
    expect(summary.totalPlanned).toBe(3000)
    expect(summary.actualSpend).toBe(1900)
    expect(summary.netSpend).toBe(1900)
    expect(summary.remaining).toBe(3100)
  })

  it('requires read permission', async () => {
    const { service } = createService({
      getSettings: jest.fn().mockResolvedValue({ targetTotal: 0, currency: 'USD' }),
      findCategoriesWithExpenses: jest.fn().mockResolvedValue([]),
    })
    await service.getOverview(ctx, WEDDING_ID)
    expect(mockRequirePermission).toHaveBeenCalledWith(ctx, { budget: ['read'] })
  })
})

describe('BudgetService.setCurrency', () => {
  it('requires update permission and persists the currency', async () => {
    const { service, repository } = createService({
      setCurrency: jest.fn().mockResolvedValue('GBP'),
    })

    const result = await service.setCurrency(ctx, WEDDING_ID, 'GBP')

    expect(mockRequirePermission).toHaveBeenCalledWith(ctx, { budget: ['update'] })
    expect(repository.setCurrency).toHaveBeenCalledWith(WEDDING_ID, 'GBP')
    expect(result).toBe('GBP')
  })
})

describe('BudgetService category ownership', () => {
  it('rejects updating a category from another wedding', async () => {
    const { service } = createService({
      findCategoryById: jest
        .fn()
        .mockResolvedValue({ id: 'category-1', weddingId: OTHER_WEDDING_ID }),
    })

    await expect(
      service.updateCategory(ctx, WEDDING_ID, { categoryId: 'category-1', name: 'Hacked' })
    ).rejects.toThrow(TRPCError)
  })

  it('throws NOT_FOUND when the category is missing', async () => {
    const { service } = createService({
      findCategoryById: jest.fn().mockResolvedValue(null),
    })

    await expect(service.deleteCategory(ctx, WEDDING_ID, 'missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('creates a category at the next position', async () => {
    const created = makeCategory({ id: 'new', name: 'Catering', plannedAmount: 3000 })
    const { service, repository } = createService({
      nextCategoryPosition: jest.fn().mockResolvedValue(3),
      createCategory: jest.fn().mockResolvedValue(created),
    })

    await service.createCategory(ctx, WEDDING_ID, { name: 'Catering', plannedAmount: 3000 })

    expect(repository.createCategory).toHaveBeenCalledWith({
      weddingId: WEDDING_ID,
      name: 'Catering',
      plannedAmount: 3000,
      position: 3,
    })
  })
})

describe('BudgetService expense ownership', () => {
  it('rejects creating an expense in a category from another wedding', async () => {
    const { service } = createService({
      findCategoryById: jest
        .fn()
        .mockResolvedValue({ id: 'category-1', weddingId: OTHER_WEDDING_ID }),
    })

    await expect(
      service.createExpense(ctx, WEDDING_ID, {
        categoryId: 'category-1',
        description: 'Sneaky',
        amount: 100,
      })
    ).rejects.toThrow(TRPCError)
  })

  it('defaults deposit and refund flags when creating an expense', async () => {
    const { service, repository } = createService({
      findCategoryById: jest.fn().mockResolvedValue({ id: 'category-1', weddingId: WEDDING_ID }),
      createExpense: jest.fn().mockResolvedValue(makeExpense({ id: 'e1', amount: 100 })),
    })

    await service.createExpense(ctx, WEDDING_ID, {
      categoryId: 'category-1',
      description: 'Deposit',
      amount: 100,
    })

    expect(repository.createExpense).toHaveBeenCalledWith(
      expect.objectContaining({
        weddingId: WEDDING_ID,
        categoryId: 'category-1',
        amount: 100,
        isDeposit: false,
        isRefundable: false,
        refundedAt: null,
        paidAt: null,
        notes: null,
      })
    )
  })

  it('rejects updating an expense from another wedding', async () => {
    const { service } = createService({
      findExpenseById: jest.fn().mockResolvedValue({ id: 'e1', weddingId: OTHER_WEDDING_ID }),
    })

    await expect(
      service.updateExpense(ctx, WEDDING_ID, { expenseId: 'e1', amount: 5 })
    ).rejects.toThrow(TRPCError)
  })
})
