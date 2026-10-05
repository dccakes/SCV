'use client'

import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import type {
  BudgetCategoryWithExpenses,
  BudgetExpense,
} from '~/server/domains/budget/budget.types'
import { api } from '~/trpc/react'

type CategoryCardProps = {
  category: BudgetCategoryWithExpenses
  currency: string
}

function TimingLine({ expense }: { expense: BudgetExpense }) {
  if (expense.paidAt) {
    return (
      <p className='font-mono text-success text-xs'>
        Paid {new Date(expense.paidAt).toLocaleDateString()}
      </p>
    )
  }
  if (expense.dueAt) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const overdue = new Date(expense.dueAt) < today
    return (
      <p className={`font-mono text-xs ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
        {overdue ? 'Overdue · ' : 'Due '}
        {new Date(expense.dueAt).toLocaleDateString()}
      </p>
    )
  }
  return <p className='font-mono text-muted-foreground text-xs'>Not scheduled</p>
}

function ExpenseTable({
  category,
  currency,
  onEdit,
  onDelete,
  onAdd,
}: {
  category: BudgetCategoryWithExpenses
  currency: string
  onEdit: (expense: BudgetExpense) => void
  onDelete: (id: string) => void
  onAdd: () => void
}) {
  return (
    <div className='relative min-w-0 overflow-x-auto'>
      <table className='w-full min-w-[580px] border-collapse text-sm'>
        <caption className='sr-only'>Expenses for {category.name}</caption>
        <thead>
          <tr className='border-border/60 border-b bg-muted/40 text-left font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest'>
            <th scope='col' className='px-5 py-4 font-normal'>
              Expense
            </th>
            <th scope='col' className='px-3 py-4 text-right font-normal'>
              Estimated
            </th>
            <th scope='col' className='px-3 py-4 text-right font-normal'>
              Actual
            </th>
            <th scope='col' className='px-3 py-4 font-normal'>
              Status / date
            </th>
            <th scope='col' className='px-3 py-4 font-normal'>
              <span className='sr-only'>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {category.expenses.length === 0 ? (
            <tr>
              <td colSpan={5} className='px-5 py-12 text-center text-muted-foreground'>
                No expenses recorded yet. Add your first expense below.
              </td>
            </tr>
          ) : (
            category.expenses.map((expense) => (
              <tr
                key={expense.id}
                className='border-border/50 border-b transition-colors hover:bg-muted/30'
              >
                <td className='px-5 py-5'>
                  <p className='break-words font-medium text-foreground'>{expense.description}</p>
                  <div className='mt-1.5 flex flex-wrap gap-1'>
                    {expense.isDeposit ? (
                      <Badge variant='secondary' className='text-[0.55rem]'>
                        Deposit
                      </Badge>
                    ) : null}
                    {expense.isRefundable ? (
                      <Badge
                        variant='outline'
                        className='border-success/40 text-[0.55rem] text-success'
                      >
                        {expense.refundedAt ? 'Refunded' : 'Refundable'}
                      </Badge>
                    ) : null}
                  </div>
                  {expense.notes ? (
                    <p className='mt-1 line-clamp-2 text-muted-foreground text-xs'>
                      {expense.notes}
                    </p>
                  ) : null}
                </td>
                <td className='whitespace-nowrap px-3 py-5 text-right font-mono text-muted-foreground text-xs tabular-nums'>
                  {formatCurrency(expense.estimatedAmount, currency)}
                </td>
                <td className='whitespace-nowrap px-3 py-5 text-right font-mono text-foreground text-xs tabular-nums'>
                  {formatCurrency(expense.amount, currency)}
                </td>
                <td className='px-3 py-5'>
                  <TimingLine expense={expense} />
                </td>
                <td className='px-3 py-5'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        aria-label={`Actions for ${expense.description}`}
                      >
                        <MoreHorizontal className='h-4 w-4' aria-hidden='true' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onSelect={() => onEdit(expense)}>
                        <Pencil aria-hidden='true' />
                        Edit expense
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => onDelete(expense.id)}
                        className='text-destructive'
                      >
                        <Trash2 aria-hidden='true' />
                        Delete expense
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))
          )}
          <tr>
            <td colSpan={5} className='border-border/60 border-b'>
              <Button
                type='button'
                variant='ghost'
                onClick={onAdd}
                className='h-14 w-full justify-start gap-2 rounded-none px-5 text-primary hover:bg-primary/5 hover:text-primary'
              >
                <Plus className='h-4 w-4' aria-hidden='true' />
                Add new expense
              </Button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr className='bg-muted/40 font-mono text-xs'>
            <th scope='row' className='px-5 py-5 text-left font-normal'>
              Section total
            </th>
            <td className='whitespace-nowrap px-3 py-5 text-right tabular-nums'>
              {formatCurrency(category.totals.estimatedTotal, currency)}
            </td>
            <td className='whitespace-nowrap px-3 py-5 text-right tabular-nums'>
              {formatCurrency(category.totals.actualSpend, currency)}
            </td>
            <td colSpan={2} className='px-3 py-5 text-success'>
              {formatCurrency(category.totals.netSpend, currency)} net spend
            </td>
          </tr>
        </tfoot>
      </table>
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
    ? Math.max(0, Math.min(100, Math.round((totals.netSpend / totals.plannedAmount) * 100)))
    : 0
  const overBudget = hasPlanned && totals.netSpend > totals.plannedAmount

  return (
    <section
      id='budget-category-detail'
      aria-labelledby={`budget-category-heading-${category.id}`}
      className='min-w-0'
    >
      <header className='border-border/70 border-b bg-background/30 p-5 md:p-6'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='min-w-0'>
            <p className='font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest'>
              Selected section
            </p>
            <h3
              id={`budget-category-heading-${category.id}`}
              className='mt-1 break-words font-display text-3xl text-foreground italic'
            >
              {category.name}
            </h3>
            <p className='mt-1 text-muted-foreground text-xs'>
              {category.expenses.length} {category.expenses.length === 1 ? 'expense' : 'expenses'} ·{' '}
              {formatCurrency(totals.actualSpend, currency)} paid so far
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setShowEditCategory(true)}
            >
              Edit section
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => setConfirmDeleteCategory(true)}
              className='text-muted-foreground hover:text-destructive'
            >
              Delete
            </Button>
          </div>
        </div>
        <div className='mt-5'>
          <div className='mb-2 flex flex-wrap justify-between gap-2 font-mono text-xs'>
            <span className='text-muted-foreground'>
              {hasPlanned
                ? `${formatCurrency(totals.netSpend, currency)} net of ${formatCurrency(totals.plannedAmount, currency)}`
                : `${formatCurrency(totals.netSpend, currency)} net spend · no budget set`}
            </span>
            {hasPlanned ? (
              <span className={overBudget ? 'text-destructive' : 'text-success'}>
                {overBudget
                  ? `${formatCurrency(totals.netSpend - totals.plannedAmount, currency)} over`
                  : `${formatCurrency(totals.remaining, currency)} left`}
              </span>
            ) : null}
          </div>
          {hasPlanned ? (
            <div className='h-1.5 overflow-hidden rounded-full bg-muted'>
              <div
                className={`h-full rounded-full transition-all ${overBudget ? 'bg-destructive' : 'bg-success'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          ) : null}
        </div>
        {totals.refundableDeposits > 0 ? (
          <p className='mt-4 text-muted-foreground text-xs'>
            {formatCurrency(totals.refundableDeposits, currency)} refundable deposits excluded from
            net spend
            {totals.outstandingDeposits > 0
              ? ` · ${formatCurrency(totals.outstandingDeposits, currency)} still to return`
              : ''}
          </p>
        ) : null}
      </header>
      <ExpenseTable
        category={category}
        currency={currency}
        onEdit={setEditExpense}
        onDelete={setDeleteExpenseId}
        onAdd={() => setShowAddExpense(true)}
      />
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
    </section>
  )
}
