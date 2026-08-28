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
            images: [],
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

  // Image operation mocks
  const mockVendorImageCreateMany = jest.fn()
  const mockVendorImageFindMany = jest.fn()
  const mockVendorImageDelete = jest.fn()
  const mockVendorImageUpdateMany = jest.fn()
  const mockVendorImageUpdate = jest.fn()

  const mockTransactionFn = jest.fn()

  const mockDb = {
    vendorNote: {
      findMany: mockVendorNoteFindMany,
    },
    vendorCategoryConfig: {
      findFirst: mockVendorCategoryConfigFindFirst,
      upsert: mockVendorCategoryConfigUpsert,
    },
    vendorImage: {
      createMany: mockVendorImageCreateMany,
      findMany: mockVendorImageFindMany,
      delete: mockVendorImageDelete,
      updateMany: mockVendorImageUpdateMany,
      update: mockVendorImageUpdate,
    },
    $transaction: mockTransactionFn,
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

describe('VendorRepository image operations', () => {
  const mockVendorImageCreateMany = jest.fn()
  const mockVendorImageFindMany = jest.fn()
  const mockVendorImageDelete = jest.fn()
  const mockVendorImageUpdateMany = jest.fn()
  const mockVendorImageUpdate = jest.fn()
  const mockTransactionFn = jest.fn()

  const mockDb = {
    vendorImage: {
      createMany: mockVendorImageCreateMany,
      findMany: mockVendorImageFindMany,
      delete: mockVendorImageDelete,
      updateMany: mockVendorImageUpdateMany,
      update: mockVendorImageUpdate,
    },
    $transaction: mockTransactionFn,
  }

  let repository: VendorRepository

  const mockImageRow = {
    id: 'image-123',
    vendorId: 'vendor-123',
    url: 'https://abc123.public.blob.vercel-storage.com/photo.jpg',
    key: 'photo.jpg',
    size: 204800,
    name: 'photo.jpg',
    isPrimary: false,
    order: 0,
    source: 'manual',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  }

  beforeEach(() => {
    jest.resetAllMocks()
    repository = new VendorRepository(mockDb as never)

    // Default transaction implementation: execute the callback with a tx proxy
    mockTransactionFn.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        vendorImage: {
          createMany: mockVendorImageCreateMany,
          findMany: mockVendorImageFindMany,
          updateMany: mockVendorImageUpdateMany,
          update: mockVendorImageUpdate,
        },
      }
      return cb(tx)
    })
  })

  describe('saveImages', () => {
    it('should save image records and return them ordered', async () => {
      const images = [
        {
          name: 'photo.jpg',
          url: 'https://example.com/photo.jpg',
          key: 'photo.jpg',
          size: 204800,
          source: 'manual' as const,
        },
      ]
      mockVendorImageCreateMany.mockResolvedValue({ count: 1 })
      mockVendorImageFindMany.mockResolvedValue([mockImageRow])

      const result = await repository.saveImages('vendor-123', images)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'image-123',
        vendorId: 'vendor-123',
        key: 'photo.jpg',
        source: 'manual',
      })
    })

    it('should call createMany with vendorId attached to each image', async () => {
      const images = [
        {
          name: 'photo.jpg',
          url: 'https://example.com/photo.jpg',
          key: 'photo.jpg',
          size: 204800,
          source: 'manual' as const,
        },
      ]
      mockVendorImageCreateMany.mockResolvedValue({ count: 1 })
      mockVendorImageFindMany.mockResolvedValue([mockImageRow])

      await repository.saveImages('vendor-123', images)

      expect(mockVendorImageCreateMany).toHaveBeenCalledWith({
        data: [{ ...images[0], vendorId: 'vendor-123' }],
      })
    })

    it('should query saved images ordered by order asc then createdAt asc', async () => {
      mockVendorImageCreateMany.mockResolvedValue({ count: 1 })
      mockVendorImageFindMany.mockResolvedValue([mockImageRow])

      await repository.saveImages('vendor-123', [
        {
          name: 'photo.jpg',
          url: 'https://example.com/photo.jpg',
          key: 'photo.jpg',
          size: 204800,
          source: 'manual' as const,
        },
      ])

      expect(mockVendorImageFindMany).toHaveBeenCalledWith({
        where: { vendorId: 'vendor-123' },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      })
    })
  })

  describe('deleteImage', () => {
    it('should delete the image and return it with its blob key', async () => {
      mockVendorImageDelete.mockResolvedValue(mockImageRow)

      const result = await repository.deleteImage('image-123')

      expect(result).toMatchObject({ id: 'image-123', key: 'photo.jpg' })
      expect(mockVendorImageDelete).toHaveBeenCalledWith({ where: { id: 'image-123' } })
    })
  })

  describe('setCoverImage', () => {
    it('should clear isPrimary on all vendor images then set it on the target', async () => {
      const primaryImageRow = { ...mockImageRow, isPrimary: true }
      mockVendorImageUpdateMany.mockResolvedValue({ count: 3 })
      mockVendorImageUpdate.mockResolvedValue(primaryImageRow)

      const result = await repository.setCoverImage('vendor-123', 'image-123')

      expect(result).toMatchObject({ id: 'image-123', isPrimary: true })
      expect(mockVendorImageUpdateMany).toHaveBeenCalledWith({
        where: { vendorId: 'vendor-123' },
        data: { isPrimary: false },
      })
      expect(mockVendorImageUpdate).toHaveBeenCalledWith({
        where: { id: 'image-123' },
        data: { isPrimary: true },
      })
    })

    it('should run clear and set operations inside a transaction', async () => {
      mockVendorImageUpdateMany.mockResolvedValue({ count: 1 })
      mockVendorImageUpdate.mockResolvedValue({ ...mockImageRow, isPrimary: true })

      await repository.setCoverImage('vendor-123', 'image-123')

      expect(mockTransactionFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('getVendorImageKeys', () => {
    it('should return all blob keys for a vendor images', async () => {
      mockVendorImageFindMany.mockResolvedValue([{ key: 'photo1.jpg' }, { key: 'photo2.jpg' }])

      const result = await repository.getVendorImageKeys('vendor-123')

      expect(result).toEqual(['photo1.jpg', 'photo2.jpg'])
      expect(mockVendorImageFindMany).toHaveBeenCalledWith({
        where: { vendorId: 'vendor-123' },
        select: { key: true },
      })
    })

    it('should return empty array when vendor has no images', async () => {
      mockVendorImageFindMany.mockResolvedValue([])

      const result = await repository.getVendorImageKeys('vendor-123')

      expect(result).toEqual([])
    })
  })
})
