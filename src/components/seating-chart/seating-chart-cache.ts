import { useCallback, useMemo, useRef, useState } from 'react'

import type { SeatingChart } from '~/server/domains/seating/seating.types'

type ChartUpdate = (chart: SeatingChart) => SeatingChart

type PendingUpdate = { id: number; eventId: string; apply: ChartUpdate }

export type PendingChange = { id: number; eventId: string }

/**
 * The chart to show: server data with the still-pending updates for that event
 * replayed on top, in the order they were made. Updates are "set" operations,
 * so replaying one the server already applied is harmless.
 */
export const withPendingUpdates = (
  serverChart: SeatingChart | undefined,
  pending: readonly PendingUpdate[],
  eventId: string | null
): SeatingChart | undefined => {
  if (!serverChart) return undefined
  return pending
    .filter((update) => update.eventId === eventId)
    .reduce((chart, update) => update.apply(chart), serverChart)
}

type UseOptimisticChartOptions = {
  serverChart: SeatingChart | undefined
  eventId: string | null
  // Refetches the event's chart; resolves once fresh data is in the cache
  refetch: (eventId: string) => Promise<unknown>
}

/**
 * Optimistic updates that survive concurrent saves. Pending changes live in
 * an overlay instead of being written into the query cache, so a refetch from
 * one save finishing can never revert another save that is still in flight,
 * and a failure rolls back only its own change.
 */
export const useOptimisticChart = ({
  serverChart,
  eventId,
  refetch,
}: UseOptimisticChartOptions) => {
  const [pending, setPending] = useState<readonly PendingUpdate[]>([])
  const nextId = useRef(1)

  const begin = useCallback((changeEventId: string, apply: ChartUpdate): PendingChange => {
    const change = { id: nextId.current++, eventId: changeEventId }
    setPending((current) => [...current, { ...change, apply }])
    return change
  }, [])

  const settle = useCallback(
    async (change: PendingChange, { failed }: { failed: boolean }) => {
      const drop = () =>
        setPending((current) => current.filter((update) => update.id !== change.id))
      // A failed change never reached the server: undo it now. A successful
      // one stays until the refetch that includes it lands, so it never flashes
      if (failed) drop()
      try {
        await refetch(change.eventId)
      } finally {
        drop()
      }
    },
    [refetch]
  )

  const chart = useMemo(
    () => withPendingUpdates(serverChart, pending, eventId),
    [serverChart, pending, eventId]
  )

  return { chart, begin, settle, pendingCount: pending.length }
}
