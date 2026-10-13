import { createChartCache } from '~/components/seating-chart/seating-chart-cache'
import type { SeatingChart } from '~/server/domains/seating/seating.types'

const chartA: SeatingChart = { tables: [], households: [] }
const chartAUpdated: SeatingChart = {
  tables: [
    { id: 't1', name: 'T1', shape: 'ROUND', capacity: 8, positionX: 0, positionY: 0, guestIds: [] },
  ],
  households: [],
}

const buildClient = () => ({
  cancel: jest.fn().mockResolvedValue(undefined),
  getData: jest.fn().mockReturnValue(chartA),
  setData: jest.fn(),
  invalidate: jest.fn().mockResolvedValue(undefined),
})

describe('createChartCache', () => {
  it('applies the optimistic update to the event the mutation started in', async () => {
    const client = buildClient()
    const cache = createChartCache(client)

    const context = await cache.optimistic({ eventId: 'A' }, () => chartAUpdated)

    expect(client.cancel).toHaveBeenCalledWith({ eventId: 'A' })
    expect(client.setData).toHaveBeenCalledWith({ eventId: 'A' }, chartAUpdated)
    expect(context).toEqual({ input: { eventId: 'A' }, previous: chartA })
  })

  it('rolls back and refreshes the original event even after switching events', async () => {
    const client = buildClient()
    const cache = createChartCache(client)
    const context = await cache.optimistic({ eventId: 'A' }, () => chartAUpdated)
    client.setData.mockClear()

    // The user has since switched to event B; the context still points at A
    cache.rollback(context)
    await cache.refresh(context)

    expect(client.setData).toHaveBeenCalledWith({ eventId: 'A' }, chartA)
    expect(client.invalidate).toHaveBeenCalledWith({ eventId: 'A' })
  })

  it('does nothing on rollback when there was no cached chart', () => {
    const client = buildClient()
    const cache = createChartCache(client)

    cache.rollback({ input: { eventId: 'A' } })
    cache.rollback(undefined)

    expect(client.setData).not.toHaveBeenCalled()
  })
})
