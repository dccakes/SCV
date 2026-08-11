'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { formatCurrency } from '~/components/budget/format'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { SUPPORTED_CURRENCIES } from '~/lib/budget/currency'
import type { BudgetSummary as BudgetSummaryData } from '~/server/domains/budget/budget.types'
import { api } from '~/trpc/react'

type BudgetSummaryProps = {
  summary: BudgetSummaryData
  currency: string
}

function StatTile({
  label,
  value,
  tone = 'default',
  hint,
}: {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative'
  hint?: string
}) {
  const valueColor =
    tone === 'negative'
      ? 'text-destructive'
      : tone === 'positive'
        ? 'text-success'
        : 'text-foreground'
  return (
    <div className='rounded-lg border border-border/70 bg-card p-4'>
      <p className='font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest'>
        {label}
      </p>
      <p className={`mt-2 font-serif text-2xl ${valueColor}`}>{value}</p>
      {hint ? <p className='mt-1 text-muted-foreground text-xs'>{hint}</p> : null}
    </div>
  )
}

function BudgetSettingsDialog({
  currentTarget,
  currentCurrency,
}: {
  currentTarget: number
  currentCurrency: string
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(currentTarget ? String(currentTarget) : '')
  const [currency, setCurrency] = useState(currentCurrency)
  const utils = api.useUtils()

  const resetFields = () => {
    setValue(currentTarget ? String(currentTarget) : '')
    setCurrency(currentCurrency)
  }

  const setTarget = api.budget.setTarget.useMutation()
  const setCurrencyMutation = api.budget.setCurrency.useMutation()
  const isPending = setTarget.isPending || setCurrencyMutation.isPending

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const parsed = value ? Number.parseFloat(value) : 0
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Enter a valid amount')
      return
    }

    if (currency === currentCurrency && parsed === currentTarget) {
      setOpen(false)
      return
    }

    try {
      if (currency !== currentCurrency) {
        await setCurrencyMutation.mutateAsync({ currency })
      }
      if (parsed !== currentTarget) {
        await setTarget.mutateAsync({ targetTotal: parsed })
      }
      await utils.budget.getOverview.invalidate()
      toast.success('Budget settings updated')
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update budget settings')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) resetFields()
      }}
    >
      <DialogTrigger asChild>
        <Button
          type='button'
          size='sm'
          variant='outline'
          className='font-mono text-[0.62rem] uppercase tracking-widest'
        >
          {currentTarget > 0 ? 'Budget settings' : 'Set budget'}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle className='font-display text-xl italic'>Budget settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='budget-currency'>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id='budget-currency'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.code} — {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-muted-foreground text-xs'>
              All targets, section budgets, and expenses are tracked in this currency. Changing it
              does not convert existing amounts.
            </p>
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='target-total'>Overall target ({currency})</Label>
            <Input
              id='target-total'
              type='number'
              inputMode='decimal'
              min='0'
              step='0.01'
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='0.00'
            />
          </div>
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function BudgetSummary({ summary, currency }: Readonly<BudgetSummaryProps>) {
  const { targetTotal, totalPlanned, actualSpend, outstandingDeposits, netSpend, remaining } =
    summary

  const pctOfTarget =
    targetTotal > 0 ? Math.min(100, Math.round((netSpend / targetTotal) * 100)) : 0
  const overBudget = targetTotal > 0 && netSpend > targetTotal

  return (
    <section className='mb-8'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='font-serif text-foreground text-lg'>Overview</h2>
          <p className='mt-0.5 text-muted-foreground text-sm'>
            Net spend excludes refundable deposits since that money comes back to you.
          </p>
        </div>
        <BudgetSettingsDialog currentTarget={targetTotal} currentCurrency={currency} />
      </div>

      {targetTotal > 0 ? (
        <div className='mb-5'>
          <div className='mb-1.5 flex items-center justify-between font-mono text-[0.62rem] text-muted-foreground uppercase tracking-widest'>
            <span>
              {formatCurrency(netSpend, currency)} of {formatCurrency(targetTotal, currency)}
            </span>
            <span className={overBudget ? 'text-destructive' : undefined}>{pctOfTarget}%</span>
          </div>
          <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
            <div
              className={`h-full rounded-full transition-all ${
                overBudget ? 'bg-destructive' : 'bg-primary'
              }`}
              style={{ width: `${pctOfTarget}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatTile
          label='Target budget'
          value={targetTotal > 0 ? formatCurrency(targetTotal, currency) : '—'}
          hint={`Planned across sections: ${formatCurrency(totalPlanned, currency)}`}
        />
        <StatTile
          label='Actual spend'
          value={formatCurrency(actualSpend, currency)}
          hint='Gross of all payments'
        />
        <StatTile
          label='Net spend'
          value={formatCurrency(netSpend, currency)}
          hint={
            outstandingDeposits > 0
              ? `${formatCurrency(outstandingDeposits, currency)} in deposits still to return`
              : 'After refundable deposits'
          }
        />
        <StatTile
          label='Remaining'
          value={targetTotal > 0 ? formatCurrency(remaining, currency) : '—'}
          tone={targetTotal > 0 ? (remaining < 0 ? 'negative' : 'positive') : 'default'}
          hint={
            targetTotal > 0
              ? remaining < 0
                ? 'Over target budget'
                : 'Left under target'
              : 'Set a target to track remaining'
          }
        />
      </div>
    </section>
  )
}
