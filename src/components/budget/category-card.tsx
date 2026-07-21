'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { CategoryForm } from '~/components/budget/category-form'
import { ExpenseForm } from '~/components/budget/expense-form'
import { formatCurrency } from '~/components/budget/format'
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
  return (
    <div className='flex items-start justify-between gap-3 border-border/50 border-t py-2.5 first:border-t-0'>
      <div className='min-w-0'>
        <div className='flex flex-wrap items-center gap-1.5'>
          <span className='truncate font-medium text-foreground text-sm'>
            {expense.description}
          </span>
          {expense.isDeposit ? (
            <Badge variant='secondary' className='text-[0.6rem]'>
              Deposit
            </Badge>
          ) : null}
          {expense.isRefundable ? (
            <Badge
              variant='outline'
              className='border-emerald-500/40 text-[0.6rem] text-emerald-600 dark:text-emerald-400'
            >
              {expense.refundedAt ? 'Refunded' : 'Refundable'}
            </Badge>
          ) : null}
        </div>
        {expense.paidAt ? (
          <p className='mt-0.5 text-muted-foreground text-xs'>
            Paid {new Date(expense.paidAt).toLocaleDateString()}
          </p>
        ) : null}
        {expense.notes ? (
          <p className='mt-0.5 line-clamp-2 text-muted-foreground text-xs'>{expense.notes}</p>
        ) : null}
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        <span className='font-mono text-foreground text-sm tabular-nums'>
          {formatCurrency(expense.amount, currency)}
        </span>
        <button
          type='button'
          onClick={onEdit}
          className='text-muted-foreground text-xs underline-offset-2 hover:text-foreground hover:underline'
        >
          Edit
        </button>
        <button
          type='button'
          onClick={onDelete}
          className='text-muted-foreground text-xs underline-offset-2 hover:text-destructive hover:underline'
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export function CategoryCard({ category, currency }: Readonly<CategoryCardProps>) {
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

  return (
    <div className='rounded-lg border border-border/70 bg-card p-4 md:p-5'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h3 className='font-serif text-foreground text-lg'>{category.name}</h3>
          <p className='mt-0.5 font-mono text-[0.62rem] text-muted-foreground uppercase tracking-widest'>
            {hasPlanned
              ? `${formatCurrency(totals.netSpend, currency)} net of ${formatCurrency(totals.plannedAmount, currency)}`
              : `${formatCurrency(totals.netSpend, currency)} spent · no budget set`}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setShowEditCategory(true)}
            className='text-muted-foreground text-xs underline-offset-2 hover:text-foreground hover:underline'
          >
            Edit
          </button>
          <button
            type='button'
            onClick={() => setConfirmDeleteCategory(true)}
            className='text-muted-foreground text-xs underline-offset-2 hover:text-destructive hover:underline'
          >
            Delete
          </button>
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

      {totals.actualSpend !== totals.netSpend ? (
        <p className='mt-3 rounded-md bg-muted/40 px-3 py-2 text-muted-foreground text-xs'>
          {formatCurrency(totals.actualSpend, currency)} paid ·{' '}
          {formatCurrency(totals.refundableDeposits, currency)} refundable
          {totals.outstandingDeposits > 0
            ? ` (${formatCurrency(totals.outstandingDeposits, currency)} still to return)`
            : ''}
        </p>
      ) : null}

      <div className='mt-3'>
        {category.expenses.length > 0 ? (
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
        ) : (
          <p className='py-2 text-muted-foreground text-sm'>No expenses recorded yet.</p>
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
