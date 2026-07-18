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
import type { BudgetSummary as BudgetSummaryData } from '~/server/domains/budget/budget.types'
import { api } from '~/trpc/react'

type BudgetSummaryProps = {
  summary: BudgetSummaryData
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
        ? 'text-emerald-600 dark:text-emerald-400'
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

function TargetBudgetDialog({ current }: { current: number }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(current ? String(current) : '')
  const utils = api.useUtils()

  const setTarget = api.budget.setTarget.useMutation({
    onSuccess: async () => {
      await utils.budget.getOverview.invalidate()
      toast.success('Target budget updated')
      setOpen(false)
    },
    onError: (err) => toast.error(err.message || 'Could not update target budget'),
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const parsed = value ? Number.parseFloat(value) : 0
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Enter a valid amount')
      return
    }
    setTarget.mutate({ targetTotal: parsed })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setValue(current ? String(current) : '')
      }}
    >
      <DialogTrigger asChild>
        <Button
          type='button'
          size='sm'
          variant='outline'
          className='font-mono text-[0.62rem] uppercase tracking-widest'
        >
          {current > 0 ? 'Edit target' : 'Set target'}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle className='font-display text-xl italic'>Target budget</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='target-total'>Overall target (USD)</Label>
            <Input
              id='target-total'
              type='number'
              inputMode='decimal'
              min='0'
              step='0.01'
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='0.00'
              autoFocus
            />
          </div>
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={setTarget.isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={setTarget.isPending}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function BudgetSummary({ summary }: Readonly<BudgetSummaryProps>) {
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
        <TargetBudgetDialog current={targetTotal} />
      </div>

      {targetTotal > 0 ? (
        <div className='mb-5'>
          <div className='mb-1.5 flex items-center justify-between font-mono text-[0.62rem] text-muted-foreground uppercase tracking-widest'>
            <span>
              {formatCurrency(netSpend)} of {formatCurrency(targetTotal)}
            </span>
            <span className={overBudget ? 'text-destructive' : undefined}>{pctOfTarget}%</span>
          </div>
          <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
            <div
              className={`h-full rounded-full transition-all ${
                overBudget ? 'bg-destructive' : 'bg-primary'
              }`}
              style={{ width: `${Math.max(2, pctOfTarget)}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatTile
          label='Target budget'
          value={targetTotal > 0 ? formatCurrency(targetTotal) : '—'}
          hint={`Planned across sections: ${formatCurrency(totalPlanned)}`}
        />
        <StatTile
          label='Actual spend'
          value={formatCurrency(actualSpend)}
          hint='Gross of all payments'
        />
        <StatTile
          label='Net spend'
          value={formatCurrency(netSpend)}
          hint={
            outstandingDeposits > 0
              ? `${formatCurrency(outstandingDeposits)} in deposits still to return`
              : 'After refundable deposits'
          }
        />
        <StatTile
          label='Remaining'
          value={formatCurrency(remaining)}
          tone={remaining < 0 ? 'negative' : 'positive'}
          hint={remaining < 0 ? 'Over target budget' : 'Left under target'}
        />
      </div>
    </section>
  )
}
