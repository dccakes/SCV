import { VendorCategory } from '@prisma/client'

import { VendorRepository } from '~/server/domains/vendor/vendor.repository'

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
