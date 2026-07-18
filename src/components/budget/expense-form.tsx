'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import type { BudgetExpense } from '~/server/domains/budget/budget.types'
import { api } from '~/trpc/react'

type ExpenseFormBaseProps = {
  onSuccess: () => void
  onCancel: () => void
}

type ExpenseFormProps =
  | (ExpenseFormBaseProps & { mode: 'create'; categoryId: string; expense?: never })
  | (ExpenseFormBaseProps & { mode: 'edit'; expense: BudgetExpense; categoryId?: never })

function toDateInputValue(date: Date | null): string {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 10)
}

export function ExpenseForm(props: Readonly<ExpenseFormProps>) {
  const { mode, onSuccess, onCancel } = props
  const isEditing = mode === 'edit'
  const expense = mode === 'edit' ? props.expense : undefined
  const utils = api.useUtils()

  const [description, setDescription] = useState(expense?.description ?? '')
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [isDeposit, setIsDeposit] = useState(expense?.isDeposit ?? false)
  const [isRefundable, setIsRefundable] = useState(expense?.isRefundable ?? false)
  const [refundReceived, setRefundReceived] = useState(Boolean(expense?.refundedAt))
  const [paidAt, setPaidAt] = useState(toDateInputValue(expense?.paidAt ?? null))
  const [notes, setNotes] = useState(expense?.notes ?? '')

  const invalidate = () => utils.budget.getOverview.invalidate()

  const createExpense = api.budget.createExpense.useMutation({
    onSuccess: async () => {
      await invalidate()
      toast.success('Expense added')
      onSuccess()
    },
    onError: (err) => toast.error(err.message || 'Could not add expense'),
  })

  const updateExpense = api.budget.updateExpense.useMutation({
    onSuccess: async () => {
      await invalidate()
      toast.success('Expense updated')
      onSuccess()
    },
    onError: (err) => toast.error(err.message || 'Could not update expense'),
  })

  const isPending = createExpense.isPending || updateExpense.isPending

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const parsedAmount = Number.parseFloat(amount)
    if (!description.trim()) {
      toast.error('Description is required')
      return
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      toast.error('Enter a valid amount')
      return
    }

    // A refund only makes sense for a refundable deposit.
    const refundable = isDeposit && isRefundable
    const refundedAt = refundable && refundReceived ? new Date() : null

    const shared = {
      description: description.trim(),
      amount: parsedAmount,
      isDeposit,
      isRefundable: refundable,
      refundedAt,
      paidAt: paidAt ? new Date(paidAt) : null,
      notes: notes.trim() ? notes.trim() : null,
    }

    if (isEditing && expense) {
      updateExpense.mutate({ expenseId: expense.id, ...shared })
    } else if (mode === 'create') {
      createExpense.mutate({ categoryId: props.categoryId, ...shared })
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-1.5'>
        <Label htmlFor='expense-description'>Description</Label>
        <Input
          id='expense-description'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='e.g. Venue balance, Photographer deposit'
          maxLength={200}
          required
        />
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1.5'>
          <Label htmlFor='expense-amount'>Amount (USD)</Label>
          <Input
            id='expense-amount'
            type='number'
            inputMode='decimal'
            min='0'
            step='0.01'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder='0.00'
            required
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='expense-paid-at'>Date paid</Label>
          <Input
            id='expense-paid-at'
            type='date'
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
          />
        </div>
      </div>

      <div className='space-y-3 rounded-md border border-border/70 bg-muted/30 p-3'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <Label htmlFor='expense-is-deposit' className='cursor-pointer'>
              This is a deposit
            </Label>
            <p className='mt-0.5 text-muted-foreground text-xs'>
              A payment held by the vendor, often returned later.
            </p>
          </div>
          <Switch
            id='expense-is-deposit'
            checked={isDeposit}
            onCheckedChange={(checked) => {
              setIsDeposit(checked)
              if (!checked) {
                setIsRefundable(false)
                setRefundReceived(false)
              }
            }}
          />
        </div>

        {isDeposit ? (
          <div className='flex items-center justify-between gap-3 border-border/60 border-t pt-3'>
            <div>
              <Label htmlFor='expense-is-refundable' className='cursor-pointer'>
                Refundable after the event
              </Label>
              <p className='mt-0.5 text-muted-foreground text-xs'>
                Excluded from your net spend since it comes back.
              </p>
            </div>
            <Switch
              id='expense-is-refundable'
              checked={isRefundable}
              onCheckedChange={(checked) => {
                setIsRefundable(checked)
                if (!checked) setRefundReceived(false)
              }}
            />
          </div>
        ) : null}

        {isDeposit && isRefundable ? (
          <div className='flex items-center justify-between gap-3 border-border/60 border-t pt-3'>
            <Label htmlFor='expense-refund-received' className='cursor-pointer'>
              Refund received
            </Label>
            <Switch
              id='expense-refund-received'
              checked={refundReceived}
              onCheckedChange={setRefundReceived}
            />
          </div>
        ) : null}
      </div>

      <div className='space-y-1.5'>
        <Label htmlFor='expense-notes'>Notes</Label>
        <Textarea
          id='expense-notes'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder='Optional details'
          maxLength={2000}
          rows={2}
        />
      </div>

      <div className='flex justify-end gap-2 pt-1'>
        <Button type='button' variant='outline' onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type='submit' disabled={isPending}>
          {isEditing ? 'Save changes' : 'Add expense'}
        </Button>
      </div>
    </form>
  )
}
