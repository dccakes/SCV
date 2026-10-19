import { act, renderHook } from '@testing-library/react'

import {
  useOptimisticChart,
  withPendingUpdates,
} from '~/components/seating-chart/seating-chart-cache'
import type { SeatingChart } from '~/server/domains/seating/seating.types'

const chartWith = (positionX: number, name = 'T1'): SeatingChart => ({
  tables: [{ id: 't1', name, shape: 'ROUND', capacity: 8, positionX, positionY: 40, guestIds: [] }],
  households: [],
})
const moveTo =
  (positionX: number) =>
  (chart: SeatingChart): SeatingChart => ({
    ...chart,
    tables: chart.tables.map((table) => ({ ...table, positionX })),
  })
const rename =
  (name: string) =>
  (chart: SeatingChart): SeatingChart => ({
    ...chart,
    tables: chart.tables.map((table) => ({ ...table, name })),
  })

const setup = (initial: SeatingChart, eventId = 'A') => {
  const refetches: Array<{ eventId: string; resolve: () => void }> = []
  const refetch = jest.fn(
    (id: string) =>
      new Promise<void>((resolve) => {
        refetches.push({ eventId: id, resolve })
      })
  )
  const hook = renderHook(
    ({ serverChart, viewing }) => useOptimisticChart({ serverChart, eventId: viewing, refetch }),
    { initialProps: { serverChart: initial as SeatingChart | undefined, viewing: eventId } }
  )
  return { hook, refetch, refetches }
}

describe('withPendingUpdates', () => {
  it('replays pending updates for the viewed event, in order', () => {
    const pending = [
      { id: 1, eventId: 'A', apply: moveTo(400) },
      { id: 2, eventId: 'B', apply: moveTo(999) },
      { id: 3, eventId: 'A', apply: rename('Head') },
    ]
    expect(withPendingUpdates(chartWith(40), pending, 'A')?.tables[0]).toMatchObject({
      positionX: 400,
      name: 'Head',
    })
  })

  it('returns undefined while there is no server data', () => {
    expect(withPendingUpdates(undefined, [], 'A')).toBeUndefined()
  })
})

describe('useOptimisticChart', () => {
  it('keeps a pending move when an unrelated save refreshes the chart', async () => {
    const { hook, refetches } = setup(chartWith(40))

    let move = { id: 0, eventId: '' }
    let other = { id: 0, eventId: '' }
    act(() => {
      move = hook.result.current.begin('A', moveTo(400))
      other = hook.result.current.begin('A', rename('Head'))
    })
    expect(hook.result.current.chart?.tables[0]?.positionX).toBe(400)

    // The unrelated save finishes; its refetch returns server data that does
    // not include the still-pending move yet
    let settled: Promise<void> = Promise.resolve()
    act(() => {
      settled = hook.result.current.settle(other, { failed: false })
    })
    await act(async () => {
      hook.rerender({ serverChart: chartWith(40, 'Head'), viewing: 'A' })
      refetches[0]?.resolve()
      await settled
    })

    expect(hook.result.current.chart?.tables[0]).toMatchObject({ positionX: 400, name: 'Head' })
    expect(move.id).not.toBe(other.id)
  })

  it('keeps showing a successful change until its own refetch lands', async () => {
    const { hook, refetches } = setup(chartWith(40))
    let move = { id: 0, eventId: '' }
    act(() => {
      move = hook.result.current.begin('A', moveTo(400))
    })

    let settled: Promise<void> = Promise.resolve()
    act(() => {
      settled = hook.result.current.settle(move, { failed: false })
    })
    // Refetch still in flight: no flash back to the old position
    expect(hook.result.current.chart?.tables[0]?.positionX).toBe(400)

    await act(async () => {
      hook.rerender({ serverChart: chartWith(400), viewing: 'A' })
      refetches[0]?.resolve()
      await settled
    })
    expect(hook.result.current.chart?.tables[0]?.positionX).toBe(400)
    expect(hook.result.current.pendingCount).toBe(0)
  })

  it('rolls back only the failed change, keeping other pending changes', async () => {
    const { hook, refetch } = setup(chartWith(40))
    let move = { id: 0, eventId: '' }
    act(() => {
      move = hook.result.current.begin('A', moveTo(400))
      hook.result.current.begin('A', rename('Head'))
    })

    await act(async () => {
      void hook.result.current.settle(move, { failed: true })
    })

    expect(hook.result.current.chart?.tables[0]).toMatchObject({ positionX: 40, name: 'Head' })
    expect(refetch).toHaveBeenCalledWith('A')
  })

  it('applies pending changes only to the event they were made in', () => {
    const { hook } = setup(chartWith(40), 'A')
    act(() => {
      hook.result.current.begin('A', moveTo(400))
    })

    hook.rerender({ serverChart: chartWith(40), viewing: 'B' })
    expect(hook.result.current.chart?.tables[0]?.positionX).toBe(40)

    hook.rerender({ serverChart: chartWith(40), viewing: 'A' })
    expect(hook.result.current.chart?.tables[0]?.positionX).toBe(400)
  })
})
