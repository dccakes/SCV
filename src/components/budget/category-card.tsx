'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { CategoryForm } from '~/components/budget/category-form'
import { ExpenseForm } from '~/components/budget/expense-form'
import { formatCurrency } from '~/components/budget/format'
import type { ExpenseView } from '~/components/budget/view'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import type {
  BudgetCategoryWithExpenses,
  BudgetExpense,
} from '~/server/domains/budget/budget.types'
import { api } from '~/trpc/react'

type CategoryCardProps = {
  category: BudgetCategoryWithExpenses
  currency: string
  view: ExpenseView
}

/** Whether a payment is still owed and past its due date. */
function isOverdue(expense: BudgetExpense): boolean {
  if (expense.paidAt || !expense.dueAt) return false
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  return new Date(expense.dueAt) < startOfToday
}

function StatusBadges({ expense }: { expense: BudgetExpense }) {
  return (
    <>
      {expense.isDeposit ? (
        <Badge variant='secondary' className='text-[0.6rem]'>
          Deposit
        </Badge>
      ) : null}
      {expense.isRefundable ? (
        <Badge variant='outline' className='border-success/40 text-[0.6rem] text-success'>
          {expense.refundedAt ? 'Refunded' : 'Refundable'}
        </Badge>
      ) : null}
    </>
  )
}

/** Timing sub-line: paid date, or (for unpaid items) the due/overdue date. */
function TimingLine({ expense }: { expense: BudgetExpense }) {
  if (expense.paidAt) {
    return (
      <p className='mt-0.5 text-muted-foreground text-xs'>
        Paid {new Date(expense.paidAt).toLocaleDateString()}
      </p>
    )
  }
  if (expense.dueAt) {
    const overdue = isOverdue(expense)
    return (
      <p className={`mt-0.5 text-xs ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
        {overdue ? 'Overdue · ' : 'Due '}
        {new Date(expense.dueAt).toLocaleDateString()}
      </p>
    )
  }
  return null
}

function ExpenseRow({
  expense,
  currency,
  onEdit,
  onDelete,
}: {
  expense: BudgetExpense
  currency: string
  onEdit: () => void
  onDelete: () => void
}) {
  const paid = expense.amount > 0
  return (
    <div className='flex items-start justify-between gap-3 border-border/50 border-t py-2.5 first:border-t-0'>
      <div className='min-w-0'>
        <div className='flex flex-wrap items-center gap-1.5'>
          <span className='truncate font-medium text-foreground text-sm'>
            {expense.description}
          </span>
          <StatusBadges expense={expense} />
        </div>
        <TimingLine expense={expense} />
        {expense.notes ? (
          <p className='mt-0.5 line-clamp-2 text-muted-foreground text-xs'>{expense.notes}</p>
        ) : null}
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        <div className='text-right'>
          <span className='font-mono text-foreground text-sm tabular-nums'>
            {formatCurrency(paid ? expense.amount : expense.estimatedAmount, currency)}
          </span>
          {expense.estimatedAmount > 0 && paid && expense.estimatedAmount !== expense.amount ? (
            <p className='font-mono text-[0.6rem] text-muted-foreground tabular-nums'>
              est {formatCurrency(expense.estimatedAmount, currency)}
            </p>
          ) : null}
          {!paid && expense.estimatedAmount > 0 ? (
            <p className='font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest'>
              estimate
            </p>
          ) : null}
        </div>
        <Button type='button' variant='ghost' size='sm' onClick={onEdit}>
          Edit
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={onDelete}
          className='hover:text-destructive'
        >
          Delete
        </Button>
      </div>
    </div>
  )
}

function ExpenseTable({
  expenses,
  currency,
  totals,
  onEdit,
  onDelete,
}: {
  expenses: BudgetExpense[]
  currency: string
  totals: BudgetCategoryWithExpenses['totals']
  onEdit: (expense: BudgetExpense) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full border-collapse text-sm'>
        <thead>
          <tr className='border-border/50 border-b text-left font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
            <th className='py-2 pr-3 font-normal'>Item</th>
            <th className='py-2 pr-3 text-right font-normal'>Estimated</th>
            <th className='py-2 pr-3 text-right font-normal'>Actual</th>
            <th className='py-2 pr-3 font-normal'>Due / Paid</th>
            <th className='py-2 font-normal'>
              <span className='sr-only'>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id} className='border-border/40 border-b last:border-b-0'>
              <td className='py-2.5 pr-3 align-top'>
                <div className='flex flex-wrap items-center gap-1.5'>
                  <span className='font-medium text-foreground'>{expense.description}</span>
                  <StatusBadges expense={expense} />
                </div>
                {expense.notes ? (
                  <p className='mt-0.5 line-clamp-1 text-muted-foreground text-xs'>
                    {expense.notes}
                  </p>
                ) : null}
              </td>
              <td className='py-2.5 pr-3 text-right align-top font-mono text-muted-foreground tabular-nums'>
                {expense.estimatedAmount > 0
                  ? formatCurrency(expense.estimatedAmount, currency)
                  : '—'}
              </td>
              <td className='py-2.5 pr-3 text-right align-top font-mono text-foreground tabular-nums'>
                {expense.amount > 0 ? formatCurrency(expense.amount, currency) : '—'}
              </td>
              <td className='py-2.5 pr-3 align-top'>
                <TimingLine expense={expense} />
              </td>
              <td className='py-2.5 align-top'>
                <div className='flex items-center justify-end gap-1'>
                  <Button type='button' variant='ghost' size='sm' onClick={() => onEdit(expense)}>
                    Edit
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => onDelete(expense.id)}
                    className='hover:text-destructive'
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className='border-border/50 border-t font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest'>
            <td className='py-2 pr-3'>Total</td>
            <td className='py-2 pr-3 text-right text-foreground tabular-nums'>
              {formatCurrency(totals.estimatedTotal, currency)}
            </td>
            <td className='py-2 pr-3 text-right text-foreground tabular-nums'>
              {formatCurrency(totals.actualSpend, currency)}
            </td>
            <td className='py-2' colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export function CategoryCard({ category, currency, view }: Readonly<CategoryCardProps>) {
  const [expanded, setExpanded] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editExpense, setEditExpense] = useState<BudgetExpense | null>(null)
  const [showEditCategory, setShowEditCategory] = useState(false)
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState(false)
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null)
  const utils = api.useUtils()

  const invalidate = () => utils.budget.getOverview.invalidate()

  const deleteCategory = api.budget.deleteCategory.useMutation({
    onSuccess: async () => {
      await invalidate()
      toast.success('Section deleted')
      setConfirmDeleteCategory(false)
    },
    onError: (err) => toast.error(err.message || 'Could not delete section'),
  })

  const deleteExpense = api.budget.deleteExpense.useMutation({
    onSuccess: async () => {
      await invalidate()
      toast.success('Expense deleted')
      setDeleteExpenseId(null)
    },
    onError: (err) => toast.error(err.message || 'Could not delete expense'),
  })

  const { totals } = category
  const hasPlanned = totals.plannedAmount > 0
  const pct = hasPlanned
    ? Math.min(100, Math.round((totals.netSpend / totals.plannedAmount) * 100))
    : 0
  const overBudget = hasPlanned && totals.netSpend > totals.plannedAmount

  const expenseCount = category.expenses.length
  const contentId = `budget-section-${category.id}`

  return (
    <div className='rounded-lg border border-border/70 bg-card'>
      <button
        type='button'
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={contentId}
        className='flex w-full items-center gap-3 rounded-lg p-4 text-left transition-colors hover:bg-muted/40 md:p-5'
      >
        <ChevronDown
          aria-hidden='true'
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            expanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
        <div className='min-w-0 flex-1'>
          <h3 className='truncate font-serif text-foreground text-lg'>{category.name}</h3>
          <p className='mt-0.5 font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest'>
            {expenseCount} {expenseCount === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-5 sm:gap-8'>
          <div className='text-right'>
            <p className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
              Budget
            </p>
            <p className='mt-0.5 font-mono text-foreground text-sm tabular-nums'>
              {hasPlanned ? formatCurrency(totals.plannedAmount, currency) : '—'}
            </p>
          </div>
          <div className='text-right'>
            <p className='font-mono text-[0.55rem] text-muted-foreground uppercase tracking-widest'>
              Paid
            </p>
            <p
              className={`mt-0.5 font-mono text-sm tabular-nums ${
                overBudget ? 'text-destructive' : 'text-foreground'
              }`}
            >
              {formatCurrency(totals.actualSpend, currency)}
            </p>
          </div>
        </div>
      </button>

      {expanded ? (
        <div id={contentId} className='border-border/60 border-t px-4 pb-4 md:px-5 md:pb-5'>
          <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
            <p className='font-mono text-[0.62rem] text-muted-foreground uppercase tracking-widest'>
              {hasPlanned
                ? `${formatCurrency(totals.netSpend, currency)} net of ${formatCurrency(totals.plannedAmount, currency)}`
                : `${formatCurrency(totals.netSpend, currency)} spent · no budget set`}
            </p>
            <div className='flex items-center gap-2'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => setShowEditCategory(true)}
              >
                Edit
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => setConfirmDeleteCategory(true)}
                className='hover:text-destructive'
              >
                Delete
              </Button>
            </div>
          </div>

          {hasPlanned ? (
            <div className='mt-3'>
              <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className={`h-full rounded-full ${overBudget ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </div>
              <div className='mt-1.5 flex justify-between font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest'>
                <span>
                  {overBudget
                    ? `${formatCurrency(totals.netSpend - totals.plannedAmount, currency)} over`
                    : `${formatCurrency(totals.remaining, currency)} left`}
                </span>
                <span>{pct}%</span>
              </div>
            </div>
          ) : null}

          {totals.estimatedTotal > 0 || totals.actualSpend !== totals.netSpend ? (
            <p className='mt-3 rounded-md bg-muted/40 px-3 py-2 text-muted-foreground text-xs'>
              {totals.estimatedTotal > 0
                ? `${formatCurrency(totals.estimatedTotal, currency)} estimated · `
                : ''}
              {formatCurrency(totals.actualSpend, currency)} paid
              {totals.refundableDeposits > 0
                ? ` · ${formatCurrency(totals.refundableDeposits, currency)} refundable${
                    totals.outstandingDeposits > 0
                      ? ` (${formatCurrency(totals.outstandingDeposits, currency)} still to return)`
                      : ''
                  }`
                : ''}
            </p>
          ) : null}

          <div className='mt-3'>
            {category.expenses.length === 0 ? (
              <p className='py-2 text-muted-foreground text-sm'>No expenses recorded yet.</p>
            ) : view === 'table' ? (
              <ExpenseTable
                expenses={category.expenses}
                currency={currency}
                totals={totals}
                onEdit={(expense) => setEditExpense(expense)}
                onDelete={(id) => setDeleteExpenseId(id)}
              />
            ) : (
              <div>
                {category.expenses.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    currency={currency}
                    onEdit={() => setEditExpense(expense)}
                    onDelete={() => setDeleteExpenseId(expense.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() => setShowAddExpense(true)}
            className='mt-3 font-mono text-[0.62rem] uppercase tracking-widest'
          >
            + Add expense
          </Button>
        </div>
      ) : null}

      {/* Add expense */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle className='font-display text-xl italic'>
              Add expense · {category.name}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm
            mode='create'
            categoryId={category.id}
            currency={currency}
            onSuccess={() => setShowAddExpense(false)}
            onCancel={() => setShowAddExpense(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit expense */}
      <Dialog open={editExpense !== null} onOpenChange={(open) => !open && setEditExpense(null)}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle className='font-display text-xl italic'>Edit expense</DialogTitle>
          </DialogHeader>
          {editExpense ? (
            <ExpenseForm
              mode='edit'
              expense={editExpense}
              currency={currency}
              onSuccess={() => setEditExpense(null)}
              onCancel={() => setEditExpense(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit category */}
      <Dialog open={showEditCategory} onOpenChange={setShowEditCategory}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='font-display text-xl italic'>Edit section</DialogTitle>
          </DialogHeader>
          <CategoryForm
            mode='edit'
            category={category}
            currency={currency}
            onSuccess={() => setShowEditCategory(false)}
            onCancel={() => setShowEditCategory(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete category confirm */}
      <AlertDialog open={confirmDeleteCategory} onOpenChange={setConfirmDeleteCategory}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{category.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the section and its {category.expenses.length}{' '}
              {category.expenses.length === 1 ? 'expense' : 'expenses'}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCategory.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                deleteCategory.mutate({ categoryId: category.id })
              }}
              disabled={deleteCategory.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete expense confirm */}
      <AlertDialog
        open={deleteExpenseId !== null}
        onOpenChange={(open) => !open && setDeleteExpenseId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteExpense.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (deleteExpenseId) deleteExpense.mutate({ expenseId: deleteExpenseId })
              }}
              disabled={deleteExpense.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
