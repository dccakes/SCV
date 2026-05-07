import { VendorCategory, VendorStatus } from '@prisma/client'

import { VendorRepository } from '~/server/domains/vendor/vendor.repository'

describe('VendorRepository ratings', () => {
  it('maps aggregate and per-user ratings for vendor rows', async () => {
    const db = {
      vendor: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'vendor-1',
            weddingId: 'wedding-1',
            category: VendorCategory.VENUE,
            name: 'Test Venue',
            location: null,
            website: null,
            instagram: null,
            status: VendorStatus.IN_REVIEW,
            contactName: null,
            contactEmail: null,
            contactPhone: null,
            notes: null,
            contacted: false,
            customFields: null,
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
            quotes: [],
            ratings: [
              { userId: 'user-1', stars: 4, user: { name: 'Alex', email: 'a@example.com' } },
              { userId: 'user-2', stars: 5, user: { name: null, email: 'b@example.com' } },
            ],
          },
        ]),
      },
    } as unknown as ConstructorParameters<typeof VendorRepository>[0]

    const repository = new VendorRepository(db)
    const result = await repository.findAllByWeddingId('wedding-1')

    expect(result[0]?.ratingSummary.average).toBe(4.5)
    expect(result[0]?.ratingSummary.ratings).toEqual([
      { userId: 'user-1', userLabel: 'Alex', stars: 4 },
      { userId: 'user-2', userLabel: 'b@example.com', stars: 5 },
    ])
  })

  it('upserts rating by vendor and user keys', async () => {
    const upsert = jest.fn().mockResolvedValue({
      id: 'vr-1',
      vendorId: 'vendor-1',
      userId: 'user-1',
      stars: 3,
    })
    const db = {
      vendorRating: { upsert },
    } as unknown as ConstructorParameters<typeof VendorRepository>[0]

    const repository = new VendorRepository(db)
    const result = await repository.setRatingForUser('vendor-1', 'user-1', 3)

    expect(result).toEqual({ id: 'vr-1', vendorId: 'vendor-1', userId: 'user-1', stars: 3 })
    expect(upsert).toHaveBeenCalledWith({
      where: { vendorId_userId: { vendorId: 'vendor-1', userId: 'user-1' } },
      update: { stars: 3 },
      create: { vendorId: 'vendor-1', userId: 'user-1', stars: 3 },
      select: { id: true, vendorId: true, userId: true, stars: true },
    })
  })
})

describe('VendorRepository enrichment helpers', () => {
  const mockVendorNoteFindMany = jest.fn()
  const mockVendorCategoryConfigFindFirst = jest.fn()
  const mockVendorCategoryConfigUpsert = jest.fn()

  const mockDb = {
    vendorNote: {
      findMany: mockVendorNoteFindMany,
    },
    vendorCategoryConfig: {
      findFirst: mockVendorCategoryConfigFindFirst,
      upsert: mockVendorCategoryConfigUpsert,
    },
  }

  let repository: VendorRepository

  beforeEach(() => {
    jest.resetAllMocks()
    repository = new VendorRepository(mockDb as never)
  })

  it('loads vendor notes newest first', async () => {
    mockVendorNoteFindMany.mockResolvedValue([{ id: 'note-1' }])

    const result = await repository.findNotesByVendorId('vendor-123')

    expect(result).toEqual([{ id: 'note-1' }])
    expect(mockVendorNoteFindMany).toHaveBeenCalledWith({
      where: { vendorId: 'vendor-123' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  })

  it('returns the wedding-specific category config before checking defaults', async () => {
    const override = { id: 'config-override' }
    mockVendorCategoryConfigFindFirst.mockResolvedValueOnce(override)

    const result = await repository.findCategoryConfig('wedding-123', VendorCategory.VENUE)

    expect(result).toEqual(expect.objectContaining(override))
    expect(mockVendorCategoryConfigFindFirst).toHaveBeenCalledTimes(1)
    expect(mockVendorCategoryConfigFindFirst).toHaveBeenCalledWith({
      where: {
        weddingId: 'wedding-123',
        category: VendorCategory.VENUE,
      },
    })
  })

  it('falls back to the system default category config when no wedding override exists', async () => {
    const systemDefault = { id: 'config-default' }
    mockVendorCategoryConfigFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(systemDefault)

    const result = await repository.findCategoryConfig('wedding-123', VendorCategory.VENUE)

    expect(result).toEqual(expect.objectContaining(systemDefault))
    expect(mockVendorCategoryConfigFindFirst).toHaveBeenNthCalledWith(1, {
      where: {
        weddingId: 'wedding-123',
        category: VendorCategory.VENUE,
      },
    })
    expect(mockVendorCategoryConfigFindFirst).toHaveBeenNthCalledWith(2, {
      where: {
        weddingId: null,
        category: VendorCategory.VENUE,
      },
    })
  })

  it('upserts wedding category config rows by wedding and category', async () => {
    const fieldDefinitions = [
      { key: 'capacity', label: 'Capacity', type: 'number', displayOrder: 1 },
    ]
    const upserted = { id: 'config-1' }
    mockVendorCategoryConfigUpsert.mockResolvedValue(upserted)

    const result = await repository.upsertCategoryConfig({
      weddingId: 'wedding-123',
      category: VendorCategory.VENUE,
      fieldDefinitions,
    })

    expect(result).toEqual(expect.objectContaining(upserted))
    expect(mockVendorCategoryConfigUpsert).toHaveBeenCalledWith({
      where: {
        weddingId_category: {
          weddingId: 'wedding-123',
          category: VendorCategory.VENUE,
        },
      },
      create: {
        weddingId: 'wedding-123',
        category: VendorCategory.VENUE,
        fieldDefinitions,
      },
      update: {
        fieldDefinitions,
      },
    })
  })
})
