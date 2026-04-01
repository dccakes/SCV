import { db } from '~/server/db'
import { ETTA_DEFAULT_PERMISSIONS } from '~/lib/etta/types'
import { provisionEtta, revokeEtta } from '~/lib/etta/provision'

jest.mock('~/server/db', () => ({
  db: {
    ettaActor: {
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

const mockEttaActor = db.ettaActor as {
  upsert: jest.Mock
  updateMany: jest.Mock
}

beforeEach(() => jest.clearAllMocks())

describe('provisionEtta', () => {
  it('upserts an EttaActor with correct permissions', async () => {
    mockEttaActor.upsert.mockResolvedValue({ id: 'etta-wedding-1' })

    await provisionEtta('wedding-1')

    expect(mockEttaActor.upsert).toHaveBeenCalledWith({
      where: { weddingId: 'wedding-1' },
      create: {
        weddingId: 'wedding-1',
        actorType: 'etta',
        permissions: [...ETTA_DEFAULT_PERMISSIONS],
      },
      update: {},
    })
  })

  it('is idempotent — upsert handles existing actors', async () => {
    mockEttaActor.upsert.mockResolvedValue({ id: 'existing-actor' })

    await provisionEtta('wedding-1')

    // Same upsert call — update: {} is a no-op for existing actors
    expect(mockEttaActor.upsert).toHaveBeenCalledTimes(1)
  })
})

describe('revokeEtta', () => {
  it('sets revokedAt on existing actor', async () => {
    mockEttaActor.updateMany.mockResolvedValue({ count: 1 })

    await revokeEtta('wedding-1')

    expect(mockEttaActor.updateMany).toHaveBeenCalledWith({
      where: { weddingId: 'wedding-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    })
  })
})
