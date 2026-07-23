'use client'

import { sectionColor } from '~/components/budget/colors'
import { formatCurrency } from '~/components/budget/format'
import type { BudgetCategoryWithExpenses } from '~/server/domains/budget/budget.types'

type AllocationBarProps = {
  categories: BudgetCategoryWithExpenses[]
  currency: string
}

type Row = {
  id: string
  name: string
  value: number
  color: string
}

/**
 * Segmented "where the money goes" bar plus legend.
 *
 * The legend always lists *every* section the couple has added, so it reflects
 * their full budget and updates as sections are added. The bar sizes each
 * section by the larger of its planned budget or its net spend; sections with
 * neither yet show in the legend as "not set" until they're budgeted or spent
 * against, rather than silently disappearing.
 */
export function AllocationBar({ categories, currency }: Readonly<AllocationBarProps>) {
  const hasSpend = categories.some((category) => category.totals.netSpend > 0)

  const rows: Row[] = categories.map((category, index) => ({
    id: category.id,
    name: category.name,
    value: Math.max(0, category.totals.plannedAmount, category.totals.netSpend),
    color: sectionColor(index),
  }))

  const total = rows.reduce((acc, row) => acc + row.value, 0)
  const barSegments = rows.filter((row) => row.value > 0)

  return (
    <section className='mb-8 rounded-lg border border-border/70 bg-card p-4 md:p-5'>
      <div className='mb-3 flex items-center justify-between'>
        <p className='font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest'>
          {hasSpend ? 'Where it’s going' : 'Planned allocation'}
        </p>
        {total > 0 ? (
          <p className='font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest'>
            {formatCurrency(total, currency)}
          </p>
        ) : null}
      </div>

      {total > 0 ? (
        <div className='flex h-3 w-full overflow-hidden rounded-full bg-muted'>
          {barSegments.map((segment) => (
            <div
              key={segment.id}
              className='h-full first:rounded-l-full last:rounded-r-full'
              style={{
                width: `${(segment.value / total) * 100}%`,
                backgroundColor: segment.color,
              }}
              title={`${segment.name} · ${formatCurrency(segment.value, currency)}`}
            />
          ))}
        </div>
      ) : (
        <p className='rounded-md bg-muted/40 px-3 py-2 text-muted-foreground text-xs'>
          Add a planned budget to a section to see how your budget is split.
        </p>
      )}

      <ul className='mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3'>
        {rows.map((row) => {
          const budgeted = row.value > 0
          return (
            <li key={row.id} className='flex items-center gap-2 text-sm'>
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${budgeted ? '' : 'opacity-30'}`}
                style={{ backgroundColor: row.color }}
                aria-hidden='true'
              />
              <span className='min-w-0 flex-1 truncate text-foreground'>{row.name}</span>
              {budgeted ? (
                <>
                  <span className='font-mono text-muted-foreground text-xs tabular-nums'>
                    {total > 0 ? Math.round((row.value / total) * 100) : 0}%
                  </span>
                  <span className='font-mono text-foreground text-xs tabular-nums'>
                    {formatCurrency(row.value, currency)}
                  </span>
                </>
              ) : (
                <span className='font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest'>
                  not set
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
