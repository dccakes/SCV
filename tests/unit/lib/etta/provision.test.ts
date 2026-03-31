import { db } from '~/server/db'
import { ETTA_DEFAULT_PERMISSIONS } from '~/lib/etta/types'
import { provisionEtta, revokeEtta } from '~/lib/etta/provision'

jest.mock('~/server/db', () => ({
  db: {
    ettaActor: {
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

const mockEttaActor = db.ettaActor as {
  findUnique: jest.Mock
  create: jest.Mock
  updateMany: jest.Mock
}

describe('provisionEtta', () => {
  it('creates an EttaActor with correct permissions when no actor exists', async () => {
    mockEttaActor.findUnique.mockResolvedValue(null)
    mockEttaActor.create.mockResolvedValue({ id: 'etta-wedding-1' })

    await provisionEtta('wedding-1')

    expect(mockEttaActor.findUnique).toHaveBeenCalledWith({
      where: { weddingId: 'wedding-1' },
    })
    expect(mockEttaActor.create).toHaveBeenCalledWith({
      data: {
        weddingId: 'wedding-1',
        actorType: 'etta',
        permissions: [...ETTA_DEFAULT_PERMISSIONS],
      },
    })
  })

  it('does not create a duplicate when actor already exists', async () => {
    mockEttaActor.findUnique.mockResolvedValue({
      id: 'existing-actor',
      weddingId: 'wedding-1',
    })

    await provisionEtta('wedding-1')

    expect(mockEttaActor.findUnique).toHaveBeenCalledWith({
      where: { weddingId: 'wedding-1' },
    })
    expect(mockEttaActor.create).not.toHaveBeenCalled()
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
