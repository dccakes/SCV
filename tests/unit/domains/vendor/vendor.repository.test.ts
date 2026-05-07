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
