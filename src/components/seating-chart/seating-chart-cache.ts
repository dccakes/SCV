import type { SeatingChart } from '~/server/domains/seating/seating.types'

type ChartInput = { eventId: string }

// The subset of tRPC's utils.seating.getChart used for optimistic updates
type ChartCacheClient = {
  cancel: (input: ChartInput) => Promise<void>
  getData: (input: ChartInput) => SeatingChart | undefined
  setData: (input: ChartInput, data: SeatingChart) => void
  invalidate: (input: ChartInput) => Promise<void>
}

type ChartMutationContext = { input: ChartInput; previous?: SeatingChart }

/**
 * Optimistic updates keyed to the event a mutation started in, so a rollback
 * or refresh never lands on a different event the user has since switched to.
 */
export const createChartCache = (client: ChartCacheClient) => ({
  optimistic: async (
    input: ChartInput,
    update: (current: SeatingChart) => SeatingChart
  ): Promise<ChartMutationContext> => {
    await client.cancel(input)
    const previous = client.getData(input)
    if (previous) client.setData(input, update(previous))
    return { input, previous }
  },
  rollback: (context: ChartMutationContext | undefined) => {
    if (context?.previous) client.setData(context.input, context.previous)
  },
  refresh: (context: ChartMutationContext | undefined) =>
    context ? client.invalidate(context.input) : Promise.resolve(),
})
