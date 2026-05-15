/**
 * Tests for Vendor Domain Service
 */

import { VendorCategory, VendorStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/vendor/vendor.repository')
jest.mock('@vercel/blob', () => ({
  del: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('~/server/infrastructure/scraper/website-images')

import { del } from '@vercel/blob'

import { requirePermission } from '~/server/authz/permission-checker'
// @ts-expect-error - Importing mock functions from mocked module
import {
  mockBelongsToWedding,
  mockCountFilesByQuoteId,
  mockCreate,
  mockCreateQuote,
  mockCreateQuoteFiles,
  mockCreateVendorNote,
  mockDelete,
  mockDeleteImage,
  mockDeleteQuote,
  mockDeleteQuoteFile,
  mockFieldDefinitions,
  mockFileBelongsToQuote,
  mockFindAllByWeddingId,
  mockFindAllFileUrlsByQuoteId,
  mockFindByIdWithQuotes,
  mockFindCategoryConfig,
  mockFindCustomFieldsById,
  mockFindNotesByVendorId,
  mockQuote,
  mockQuoteBelongsToVendor,
  mockQuoteFile,
  mockSaveImages,
  mockSetCoverImage,
  mockSetRatingForUser,
  mockUpdate,
  mockUpdateQuote,
  mockUpdateStatus,
  mockUpsertCategoryConfig,
  mockVendor,
  mockVendorCategoryConfig,
  mockVendorImage,
  mockVendorNote,
  mockVendorWithQuotes,
  resetMocks,
  VendorRepository,
} from '~/server/domains/vendor/vendor.repository'
import { VendorService } from '~/server/domains/vendor/vendor.service'
// @ts-expect-error - Importing mock functions from mocked module
import { fetchWebsiteImages } from '~/server/infrastructure/scraper/website-images'

const mockFindAllByWeddingIdFn = mockFindAllByWeddingId as jest.Mock
const mockFindByIdWithQuotesFn = mockFindByIdWithQuotes as jest.Mock
const mockFindCustomFieldsByIdFn = mockFindCustomFieldsById as jest.Mock
const mockCreateFn = mockCreate as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock
const mockUpdateStatusFn = mockUpdateStatus as jest.Mock
const mockDeleteFn = mockDelete as jest.Mock
const mockBelongsToWeddingFn = mockBelongsToWedding as jest.Mock
const mockCreateQuoteFn = mockCreateQuote as jest.Mock
const mockUpdateQuoteFn = mockUpdateQuote as jest.Mock
const mockDeleteQuoteFn = mockDeleteQuote as jest.Mock
const mockQuoteBelongsToVendorFn = mockQuoteBelongsToVendor as jest.Mock
const mockCreateQuoteFilesFn = mockCreateQuoteFiles as jest.Mock
const mockDeleteQuoteFileFn = mockDeleteQuoteFile as jest.Mock
const mockFileBelongsToQuoteFn = mockFileBelongsToQuote as jest.Mock
const mockRequirePermission = requirePermission as jest.Mock
const mockFindAllFileUrlsByQuoteIdFn = mockFindAllFileUrlsByQuoteId as jest.Mock
const mockCountFilesByQuoteIdFn = mockCountFilesByQuoteId as jest.Mock
const mockSetRatingForUserFn = mockSetRatingForUser as jest.Mock
const mockFindNotesByVendorIdFn = mockFindNotesByVendorId as jest.Mock
const mockCreateVendorNoteFn = mockCreateVendorNote as jest.Mock
const mockFindCategoryConfigFn = mockFindCategoryConfig as jest.Mock
const mockUpsertCategoryConfigFn = mockUpsertCategoryConfig as jest.Mock
const mockDel = del as jest.Mock
const mockSaveImagesFn = mockSaveImages as jest.Mock
const mockDeleteImageFn = mockDeleteImage as jest.Mock
const mockSetCoverImageFn = mockSetCoverImage as jest.Mock
const mockFetchWebsiteImages = fetchWebsiteImages as jest.Mock

describe('VendorService', () => {
  let vendorService: VendorService
  const actorContext = {
    userId: 'actor-1',
    activeOrganization: null,
  }

  beforeEach(() => {
    resetMocks()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-1', role: 'admin' })
    mockDel.mockReset()
    const mockRepository = new VendorRepository({})
    vendorService = new VendorService(mockRepository)
  })

  // ─── getVendors ────────────────────────────────────────────────────────────

  describe('getVendors', () => {
    it('should return all vendors for a wedding', async () => {
      mockFindAllByWeddingIdFn.mockResolvedValue([mockVendorWithQuotes])

      const result = await vendorService.getVendorsSystem('wedding-123')

      expect(result).toEqual([mockVendorWithQuotes])
      expect(mockFindAllByWeddingIdFn).toHaveBeenCalledWith('wedding-123', undefined)
    })

    it('should filter by category when provided', async () => {
      mockFindAllByWeddingIdFn.mockResolvedValue([mockVendorWithQuotes])

      await vendorService.getVendorsSystem('wedding-123', VendorCategory.PHOTOGRAPHER)

      expect(mockFindAllByWeddingIdFn).toHaveBeenCalledWith(
        'wedding-123',
        VendorCategory.PHOTOGRAPHER
      )
    })

    it('should return empty array when no vendors exist', async () => {
      mockFindAllByWeddingIdFn.mockResolvedValue([])

      const result = await vendorService.getVendorsSystem('wedding-123')

      expect(result).toEqual([])
    })
  })

  describe('getVendorsForWedding', () => {
    it('returns vendors for the active wedding scope', async () => {
      mockFindAllByWeddingIdFn.mockResolvedValue([mockVendorWithQuotes])

      const result = await vendorService.getVendorsForWedding(actorContext, 'wedding-123')

      expect(result).toEqual([mockVendorWithQuotes])
      expect(mockFindAllByWeddingIdFn).toHaveBeenCalledWith('wedding-123', undefined)
    })

    it('sets currentUserRating from submitted ratings for getAll', async () => {
      mockFindAllByWeddingIdFn.mockResolvedValue([
        {
          ...mockVendorWithQuotes,
          ratingSummary: {
            average: 4.5,
            currentUserRating: null,
            ratings: [
              { userId: 'actor-1', userLabel: 'Actor', stars: 4 },
              { userId: 'user-2', userLabel: 'Taylor', stars: 5 },
            ],
          },
        },
      ])

      const result = await vendorService.getVendorsForWedding(actorContext, 'wedding-123')

      expect(result[0]?.ratingSummary.currentUserRating).toBe(4)
      expect(result[0]?.ratingSummary.average).toBe(4.5)
    })

    it('keeps average null for unrated vendors', async () => {
      mockFindAllByWeddingIdFn.mockResolvedValue([
        {
          ...mockVendorWithQuotes,
          ratingSummary: {
            average: null,
            currentUserRating: null,
            ratings: [],
          },
        },
      ])

      const result = await vendorService.getVendorsForWedding(actorContext, 'wedding-123')

      expect(result[0]?.ratingSummary.average).toBeNull()
      expect(result[0]?.ratingSummary.currentUserRating).toBeNull()
    })

    it('does not derive average from actor-only rating', async () => {
      mockFindAllByWeddingIdFn.mockResolvedValue([
        {
          ...mockVendorWithQuotes,
          ratingSummary: {
            average: 3,
            currentUserRating: null,
            ratings: [
              { userId: 'actor-1', userLabel: 'Actor', stars: 5 },
              { userId: 'user-2', userLabel: 'Taylor', stars: 1 },
            ],
          },
        },
      ])

      const result = await vendorService.getVendorsForWedding(actorContext, 'wedding-123')

      expect(result[0]?.ratingSummary.currentUserRating).toBe(5)
      expect(result[0]?.ratingSummary.average).toBe(3)
    })
  })

  // ─── getVendorWithQuotes ───────────────────────────────────────────────────

  describe('getVendorWithQuotes', () => {
    it('should return vendor with quotes when it belongs to the wedding', async () => {
      mockFindByIdWithQuotesFn.mockResolvedValue(mockVendorWithQuotes)

      const result = await vendorService.getVendorWithQuotes(
        actorContext,
        'vendor-123',
        'wedding-123'
      )

      expect(result).toEqual(mockVendorWithQuotes)
    })

    it('should throw NOT_FOUND when vendor does not exist', async () => {
      mockFindByIdWithQuotesFn.mockResolvedValue(null)

      await expect(
        vendorService.getVendorWithQuotes(actorContext, 'vendor-123', 'wedding-123')
      ).rejects.toThrow(TRPCError)
      await expect(
        vendorService.getVendorWithQuotes(actorContext, 'vendor-123', 'wedding-123')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it('should throw FORBIDDEN when vendor belongs to a different wedding', async () => {
      mockFindByIdWithQuotesFn.mockResolvedValue(mockVendorWithQuotes)

      await expect(
        vendorService.getVendorWithQuotes(actorContext, 'vendor-123', 'other-wedding')
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('sets currentUserRating from submitted ratings for getById', async () => {
      mockFindByIdWithQuotesFn.mockResolvedValue({
        ...mockVendorWithQuotes,
        ratingSummary: {
          average: 4,
          currentUserRating: null,
          ratings: [
            { userId: 'actor-1', userLabel: 'Actor', stars: 4 },
            { userId: 'user-2', userLabel: 'Taylor', stars: 4 },
          ],
        },
      })

      const result = await vendorService.getVendorWithQuotes(
        actorContext,
        'vendor-123',
        'wedding-123'
      )

      expect(result.ratingSummary.currentUserRating).toBe(4)
      expect(result.ratingSummary.average).toBe(4)
    })
  })

  describe('getQuote', () => {
    it('should return a single quote with files when quote belongs to vendor and wedding', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(true)
      mockFindByIdWithQuotesFn.mockResolvedValue(mockVendorWithQuotes)

      const result = await vendorService.getQuote(
        actorContext,
        'quote-123',
        'vendor-123',
        'wedding-123'
      )

      expect(result).toEqual(mockQuote)
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { vendor_quote: ['read'] })
    })

    it('should throw NOT_FOUND when quote is missing from the vendor', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(true)
      mockFindByIdWithQuotesFn.mockResolvedValue({ ...mockVendorWithQuotes, quotes: [] })

      await expect(
        vendorService.getQuote(actorContext, 'quote-123', 'vendor-123', 'wedding-123')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })

  // ─── createVendor ──────────────────────────────────────────────────────────

  describe('createVendor', () => {
    it('should create a vendor successfully', async () => {
      mockCreateFn.mockResolvedValue(mockVendor)

      const result = await vendorService.createVendor(actorContext, 'wedding-123', {
        category: VendorCategory.PHOTOGRAPHER,
        name: 'Alice Photos',
      })

      expect(result).toEqual(mockVendor)
      expect(mockCreateFn).toHaveBeenCalledWith(
        expect.objectContaining({ weddingId: 'wedding-123', name: 'Alice Photos' })
      )
    })
  })

  // ─── updateVendor ──────────────────────────────────────────────────────────

  describe('updateVendor', () => {
    it('should update vendor when it belongs to the wedding', async () => {
      const updated = { ...mockVendor, name: 'Bob Photos' }
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockUpdateFn.mockResolvedValue(updated)

      const result = await vendorService.updateVendor(actorContext, 'vendor-123', 'wedding-123', {
        vendorId: 'vendor-123',
        name: 'Bob Photos',
      })

      expect(result.name).toBe('Bob Photos')
      // vendorId must never be passed into the Prisma data payload
      expect(mockUpdateFn).toHaveBeenCalledWith(
        'vendor-123',
        expect.not.objectContaining({ vendorId: expect.anything() })
      )
    })

    it('should throw FORBIDDEN when vendor does not belong to the wedding', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        vendorService.updateVendor(actorContext, 'vendor-123', 'other-wedding', {
          vendorId: 'vendor-123',
          name: 'Test',
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('normalizes empty-string notes to null and shallow-merges custom fields', async () => {
      const updated = {
        ...mockVendor,
        contacted: true,
        notes: null,
        customFields: {
          capacity: '250',
          outdoor: 'false',
          deposit: '20%',
        },
      }

      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockFindCustomFieldsByIdFn.mockResolvedValue({
        capacity: '250',
        outdoor: 'true',
      })
      mockUpdateFn.mockResolvedValue(updated)

      const result = await vendorService.updateVendor(actorContext, 'vendor-123', 'wedding-123', {
        vendorId: 'vendor-123',
        contacted: true,
        notes: '',
        customFields: {
          outdoor: 'false',
          deposit: '20%',
        },
      })

      expect(result).toEqual(updated)
      expect(mockUpdateFn).toHaveBeenCalledWith('vendor-123', {
        contacted: true,
        notes: null,
        customFields: {
          capacity: '250',
          outdoor: 'false',
          deposit: '20%',
        },
      })
    })
  })

  describe('vendor notes', () => {
    it('returns notes for an owned vendor', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockFindNotesByVendorIdFn.mockResolvedValue([mockVendorNote])

      const result = await vendorService.getNotes(actorContext, 'vendor-123', 'wedding-123')

      expect(result).toEqual([mockVendorNote])
      expect(mockFindNotesByVendorIdFn).toHaveBeenCalledWith('vendor-123')
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { vendor: ['read'] })
    })

    it('adds a couple-authored note for an owned vendor', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockCreateVendorNoteFn.mockResolvedValue(mockVendorNote)

      const result = await vendorService.addVendorNote(
        actorContext,
        'vendor-123',
        'wedding-123',
        'Sent first outreach email'
      )

      expect(result).toEqual(mockVendorNote)
      expect(mockCreateVendorNoteFn).toHaveBeenCalledWith({
        vendorId: 'vendor-123',
        weddingId: 'wedding-123',
        message: 'Sent first outreach email',
        actorType: 'couple',
      })
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { vendor: ['update'] })
    })

    it('rejects adding a note when the vendor is outside the wedding scope', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        vendorService.addVendorNote(
          actorContext,
          'vendor-123',
          'other-wedding',
          'Sent first outreach email'
        )
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })

  describe('category config', () => {
    it('returns the category config for the active wedding scope', async () => {
      mockFindCategoryConfigFn.mockResolvedValue(mockVendorCategoryConfig)

      const result = await vendorService.getCategoryConfig(
        actorContext,
        'wedding-123',
        VendorCategory.VENUE
      )

      expect(result).toEqual(mockVendorCategoryConfig)
      expect(mockFindCategoryConfigFn).toHaveBeenCalledWith('wedding-123', VendorCategory.VENUE)
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { vendor: ['read'] })
    })

    it('upserts a wedding-specific category config', async () => {
      const weddingConfig = { ...mockVendorCategoryConfig, weddingId: 'wedding-123' }
      mockUpsertCategoryConfigFn.mockResolvedValue(weddingConfig)

      const result = await vendorService.upsertCategoryConfig(
        actorContext,
        'wedding-123',
        VendorCategory.VENUE,
        mockFieldDefinitions
      )

      expect(result).toEqual(weddingConfig)
      expect(mockUpsertCategoryConfigFn).toHaveBeenCalledWith({
        weddingId: 'wedding-123',
        category: VendorCategory.VENUE,
        fieldDefinitions: mockFieldDefinitions,
      })
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { vendor: ['update'] })
    })
  })

  // ─── updateStatus ──────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('should update vendor status when it belongs to the wedding', async () => {
      const updated = { ...mockVendor, status: VendorStatus.SELECTED }
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockUpdateStatusFn.mockResolvedValue(updated)

      const result = await vendorService.updateStatus(
        actorContext,
        'vendor-123',
        'wedding-123',
        VendorStatus.SELECTED
      )

      expect(result.status).toBe(VendorStatus.SELECTED)
    })

    it('should throw FORBIDDEN when vendor does not belong to the wedding', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        vendorService.updateStatus(
          actorContext,
          'vendor-123',
          'other-wedding',
          VendorStatus.SELECTED
        )
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })

  // ─── deleteVendor ──────────────────────────────────────────────────────────

  describe('deleteVendor', () => {
    it('should delete vendor when it belongs to the wedding', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockFindByIdWithQuotesFn.mockResolvedValue({
        ...mockVendorWithQuotes,
        quotes: [],
        images: [],
      })
      mockDeleteFn.mockResolvedValue(mockVendor)

      const result = await vendorService.deleteVendor(actorContext, 'vendor-123', 'wedding-123')

      expect(result).toBe('vendor-123')
      expect(mockDeleteFn).toHaveBeenCalledWith('vendor-123')
    })

    it('should clean up quote file blobs before cascade delete', async () => {
      const fileUrl = mockQuoteFile.url
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockFindByIdWithQuotesFn.mockResolvedValue({ ...mockVendorWithQuotes, images: [] })
      mockDeleteFn.mockResolvedValue(mockVendor)

      await vendorService.deleteVendor(actorContext, 'vendor-123', 'wedding-123')

      expect(mockDel).toHaveBeenCalledWith([fileUrl])
      expect(mockDeleteFn).toHaveBeenCalledWith('vendor-123')
    })

    it('should clean up image blobs along with file blobs before cascade delete', async () => {
      const fileUrl = mockQuoteFile.url
      const imageUrl = mockVendorImage.url
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockFindByIdWithQuotesFn.mockResolvedValue({
        ...mockVendorWithQuotes,
        images: [mockVendorImage],
      })
      mockDeleteFn.mockResolvedValue(mockVendor)

      await vendorService.deleteVendor(actorContext, 'vendor-123', 'wedding-123')

      expect(mockDel).toHaveBeenCalledWith([fileUrl, imageUrl])
    })

    it('should still delete vendor when blob cleanup fails', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockFindByIdWithQuotesFn.mockResolvedValue({ ...mockVendorWithQuotes, images: [] })
      mockDel.mockRejectedValue(new Error('Blob service error'))
      mockDeleteFn.mockResolvedValue(mockVendor)

      const result = await vendorService.deleteVendor(actorContext, 'vendor-123', 'wedding-123')

      expect(result).toBe('vendor-123')
    })

    it('should throw FORBIDDEN when vendor does not belong to the wedding', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        vendorService.deleteVendor(actorContext, 'vendor-123', 'other-wedding')
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })
  })

  // ─── addQuote ──────────────────────────────────────────────────────────────

  describe('addQuote', () => {
    it('should add quote when vendor belongs to the wedding', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockCreateQuoteFn.mockResolvedValue(mockQuote)

      const result = await vendorService.addQuote(actorContext, 'vendor-123', 'wedding-123', {
        vendorId: 'vendor-123',
        price: 2500,
        quoteDate: '2026-02-01',
        notes: 'Full day coverage',
      })

      expect(result).toEqual(mockQuote)
      expect(mockCreateQuoteFn).toHaveBeenCalledWith(
        expect.objectContaining({ vendorId: 'vendor-123' })
      )
    })

    it('should forward quoteType FLAT_FEE to repository', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockCreateQuoteFn.mockResolvedValue(mockQuote)

      await vendorService.addQuote(actorContext, 'vendor-123', 'wedding-123', {
        vendorId: 'vendor-123',
        price: 2500,
        quoteType: 'FLAT_FEE',
        quoteDate: '2026-02-01',
      })

      expect(mockCreateQuoteFn).toHaveBeenCalledWith(
        expect.objectContaining({ quoteType: 'FLAT_FEE' })
      )
    })

    it('should forward quoteType PER_GUEST to repository', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockCreateQuoteFn.mockResolvedValue({ ...mockQuote, quoteType: 'PER_GUEST' })

      await vendorService.addQuote(actorContext, 'vendor-123', 'wedding-123', {
        vendorId: 'vendor-123',
        price: 75,
        quoteType: 'PER_GUEST',
        quoteDate: '2026-02-01',
      })

      expect(mockCreateQuoteFn).toHaveBeenCalledWith(
        expect.objectContaining({ quoteType: 'PER_GUEST' })
      )
    })

    it('should throw FORBIDDEN when vendor does not belong to the wedding', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        vendorService.addQuote(actorContext, 'vendor-123', 'other-wedding', {
          vendorId: 'vendor-123',
          price: 500,
          quoteDate: '2026-03-01',
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })

  // ─── updateQuote ───────────────────────────────────────────────────────────

  describe('updateQuote', () => {
    it('should update quote when quote belongs to vendor and vendor belongs to wedding', async () => {
      const updated = { ...mockQuote, notes: 'Updated notes' }
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(true)
      mockUpdateQuoteFn.mockResolvedValue(updated)

      const result = await vendorService.updateQuote(
        actorContext,
        'quote-123',
        'vendor-123',
        'wedding-123',
        {
          quoteId: 'quote-123',
          vendorId: 'vendor-123',
          notes: 'Updated notes',
        }
      )

      expect(result.notes).toBe('Updated notes')
    })

    it('should forward quoteType update to repository', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(true)
      mockUpdateQuoteFn.mockResolvedValue({ ...mockQuote, quoteType: 'PER_GUEST' })

      await vendorService.updateQuote(actorContext, 'quote-123', 'vendor-123', 'wedding-123', {
        quoteId: 'quote-123',
        vendorId: 'vendor-123',
        quoteType: 'PER_GUEST',
      })

      expect(mockUpdateQuoteFn).toHaveBeenCalledWith(
        'quote-123',
        expect.objectContaining({ quoteType: 'PER_GUEST' })
      )
    })

    it('should throw FORBIDDEN when vendor does not belong to wedding', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        vendorService.updateQuote(actorContext, 'quote-123', 'vendor-123', 'other-wedding', {
          quoteId: 'quote-123',
          vendorId: 'vendor-123',
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('should throw FORBIDDEN when quote does not belong to vendor', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(false)

      await expect(
        vendorService.updateQuote(actorContext, 'quote-123', 'vendor-123', 'wedding-123', {
          quoteId: 'quote-123',
          vendorId: 'vendor-123',
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })

  // ─── deleteQuote ───────────────────────────────────────────────────────────

  describe('deleteQuote', () => {
    it('should delete quote when authorized', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(true)
      mockFindAllFileUrlsByQuoteIdFn.mockResolvedValue([])
      mockDeleteQuoteFn.mockResolvedValue(mockQuote)

      const result = await vendorService.deleteQuote(
        actorContext,
        'quote-123',
        'vendor-123',
        'wedding-123'
      )

      expect(result).toBe('quote-123')
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { vendor_quote: ['delete'] })
    })

    it('should clean up blob files before deleting quote', async () => {
      const urls = ['https://abc.public.blob.vercel-storage.com/proposal.pdf']
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(true)
      mockFindAllFileUrlsByQuoteIdFn.mockResolvedValue(urls)
      mockDeleteQuoteFn.mockResolvedValue(mockQuote)

      await vendorService.deleteQuote(actorContext, 'quote-123', 'vendor-123', 'wedding-123')

      expect(mockDel).toHaveBeenCalledWith(urls)
    })

    it('should still delete quote when blob cleanup fails', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(true)
      mockFindAllFileUrlsByQuoteIdFn.mockResolvedValue([
        'https://x.public.blob.vercel-storage.com/f.pdf',
      ])
      mockDel.mockRejectedValue(new Error('Blob error'))
      mockDeleteQuoteFn.mockResolvedValue(mockQuote)

      const result = await vendorService.deleteQuote(
        actorContext,
        'quote-123',
        'vendor-123',
        'wedding-123'
      )

      expect(result).toBe('quote-123')
    })

    it('should throw FORBIDDEN when vendor does not belong to wedding', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        vendorService.deleteQuote(actorContext, 'quote-123', 'vendor-123', 'other-wedding')
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      expect(mockQuoteBelongsToVendorFn).not.toHaveBeenCalled()
    })

    it('should throw FORBIDDEN when quote does not belong to vendor', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(false)

      await expect(
        vendorService.deleteQuote(actorContext, 'quote-123', 'vendor-123', 'wedding-123')
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })

  // ─── DB error propagation ──────────────────────────────────────────────────

  describe('DB error propagation', () => {
    it('deleteVendor should propagate repository errors', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockFindByIdWithQuotesFn.mockResolvedValue({
        ...mockVendorWithQuotes,
        quotes: [],
        images: [],
      })
      mockDeleteFn.mockRejectedValue(new Error('DB connection error'))

      await expect(
        vendorService.deleteVendor(actorContext, 'vendor-123', 'wedding-123')
      ).rejects.toThrow('DB connection error')
    })

    it('addQuote should propagate repository errors', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockCreateQuoteFn.mockRejectedValue(new Error('DB constraint violation'))

      await expect(
        vendorService.addQuote(actorContext, 'vendor-123', 'wedding-123', {
          vendorId: 'vendor-123',
          price: 500,
          quoteDate: '2026-03-01',
        })
      ).rejects.toThrow('DB constraint violation')
    })

    it('deleteQuote should propagate repository errors', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(true)
      mockFindAllFileUrlsByQuoteIdFn.mockResolvedValue([])
      mockDeleteQuoteFn.mockRejectedValue(new Error('Record not found'))

      await expect(
        vendorService.deleteQuote(actorContext, 'quote-123', 'vendor-123', 'wedding-123')
      ).rejects.toThrow('Record not found')
    })
  })

  // ─── saveQuoteFiles ─────────────────────────────────────────────────────────

  describe('saveQuoteFiles', () => {
    const fileInput = {
      quoteId: 'quote-123',
      vendorId: 'vendor-123',
      files: [
        {
          name: 'proposal.pdf',
          url: 'https://abc123.public.blob.vercel-storage.com/proposal.pdf',
          key: 'proposal.pdf',
          size: 102400,
        },
      ],
    }

    it('should save files when vendor and quote ownership is valid', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(true)
      mockCountFilesByQuoteIdFn.mockResolvedValue(0)
      mockCreateQuoteFilesFn.mockResolvedValue([mockQuoteFile])

      const result = await vendorService.saveQuoteFiles(
        actorContext,
        'vendor-123',
        'wedding-123',
        fileInput
      )

      expect(result).toEqual([mockQuoteFile])
      expect(mockCreateQuoteFilesFn).toHaveBeenCalledWith('quote-123', fileInput.files)
    })

    it('should throw BAD_REQUEST when total file count exceeds limit', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(true)
      mockCountFilesByQuoteIdFn.mockResolvedValue(9) // 9 existing + 1 new = 10, ok
      mockCreateQuoteFilesFn.mockResolvedValue([mockQuoteFile])

      // This should succeed (9 + 1 = 10, at the limit)
      await vendorService.saveQuoteFiles(actorContext, 'vendor-123', 'wedding-123', fileInput)

      // Now test exceeding: 10 existing + 1 new = 11
      mockCountFilesByQuoteIdFn.mockResolvedValue(10)
      await expect(
        vendorService.saveQuoteFiles(actorContext, 'vendor-123', 'wedding-123', fileInput)
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    })

    it('should throw FORBIDDEN when vendor does not belong to wedding', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        vendorService.saveQuoteFiles(actorContext, 'vendor-123', 'other-wedding', fileInput)
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('should throw FORBIDDEN when quote does not belong to vendor', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(false)

      await expect(
        vendorService.saveQuoteFiles(actorContext, 'vendor-123', 'wedding-123', fileInput)
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })

  // ─── image operations ──────────────────────────────────────────────────────

  describe('image operations', () => {
    const imageInput = {
      vendorId: 'vendor-123',
      images: [
        {
          name: 'photo.jpg',
          url: 'https://abc123.public.blob.vercel-storage.com/photo.jpg',
          key: 'photo.jpg',
          size: 204800,
          source: 'manual' as const,
        },
      ],
    }

    describe('saveImages', () => {
      it('should save images when vendor belongs to the wedding', async () => {
        mockBelongsToWeddingFn.mockResolvedValue(true)
        mockFindByIdWithQuotesFn.mockResolvedValue({ ...mockVendorWithQuotes, images: [] })
        mockSaveImagesFn.mockResolvedValue([mockVendorImage])

        const result = await vendorService.saveImages(
          actorContext,
          'vendor-123',
          'wedding-123',
          imageInput
        )

        expect(result).toEqual([mockVendorImage])
        expect(mockSaveImagesFn).toHaveBeenCalledWith('vendor-123', imageInput.images)
      })

      it('should throw FORBIDDEN when vendor does not belong to the wedding', async () => {
        mockBelongsToWeddingFn.mockResolvedValue(false)

        await expect(
          vendorService.saveImages(actorContext, 'vendor-123', 'other-wedding', imageInput)
        ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      })

      it('should throw BAD_REQUEST when adding images would exceed the limit', async () => {
        // Vendor has 3 existing, trying to add 3 more: 6 > 5
        mockBelongsToWeddingFn.mockResolvedValue(true)
        mockFindByIdWithQuotesFn.mockResolvedValue({
          ...mockVendorWithQuotes,
          images: [mockVendorImage, mockVendorImage, mockVendorImage],
        })

        const threeImages = {
          vendorId: 'vendor-123',
          images: [
            {
              name: 'a.jpg',
              url: 'https://abc123.public.blob.vercel-storage.com/a.jpg',
              key: 'a.jpg',
              size: 100,
              source: 'manual' as const,
            },
            {
              name: 'b.jpg',
              url: 'https://abc123.public.blob.vercel-storage.com/b.jpg',
              key: 'b.jpg',
              size: 100,
              source: 'manual' as const,
            },
            {
              name: 'c.jpg',
              url: 'https://abc123.public.blob.vercel-storage.com/c.jpg',
              key: 'c.jpg',
              size: 100,
              source: 'manual' as const,
            },
          ],
        }

        await expect(
          vendorService.saveImages(actorContext, 'vendor-123', 'wedding-123', threeImages)
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' })

        expect(mockSaveImagesFn).not.toHaveBeenCalled()
      })

      it('should succeed when adding images reaches exactly the limit', async () => {
        // Vendor has 3 existing, trying to add 2 more: 5 = max
        mockBelongsToWeddingFn.mockResolvedValue(true)
        mockFindByIdWithQuotesFn.mockResolvedValue({
          ...mockVendorWithQuotes,
          images: [mockVendorImage, mockVendorImage, mockVendorImage],
        })
        mockSaveImagesFn.mockResolvedValue([mockVendorImage, mockVendorImage])

        const twoImages = {
          vendorId: 'vendor-123',
          images: [
            {
              name: 'a.jpg',
              url: 'https://abc123.public.blob.vercel-storage.com/a.jpg',
              key: 'a.jpg',
              size: 100,
              source: 'manual' as const,
            },
            {
              name: 'b.jpg',
              url: 'https://abc123.public.blob.vercel-storage.com/b.jpg',
              key: 'b.jpg',
              size: 100,
              source: 'manual' as const,
            },
          ],
        }

        const result = await vendorService.saveImages(
          actorContext,
          'vendor-123',
          'wedding-123',
          twoImages
        )

        expect(result).toHaveLength(2)
      })
    })

    describe('deleteImage', () => {
      it('should delete image and clean up blob', async () => {
        mockBelongsToWeddingFn.mockResolvedValue(true)
        mockDeleteImageFn.mockResolvedValue(mockVendorImage)

        const result = await vendorService.deleteImage(
          actorContext,
          'vendor-123',
          'wedding-123',
          'image-123'
        )

        expect(result).toBe('image-123')
        expect(mockDeleteImageFn).toHaveBeenCalledWith('image-123')
        expect(mockDel).toHaveBeenCalledWith([mockVendorImage.url])
      })

      it('should throw FORBIDDEN when vendor does not belong to the wedding', async () => {
        mockBelongsToWeddingFn.mockResolvedValue(false)

        await expect(
          vendorService.deleteImage(actorContext, 'vendor-123', 'other-wedding', 'image-123')
        ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      })
    })

    describe('setCoverImage', () => {
      it('should set cover image for vendor the couple owns', async () => {
        const updatedImage = { ...mockVendorImage, isPrimary: true }
        mockBelongsToWeddingFn.mockResolvedValue(true)
        mockSetCoverImageFn.mockResolvedValue(updatedImage)

        const result = await vendorService.setCoverImage(
          actorContext,
          'vendor-123',
          'wedding-123',
          'image-123'
        )

        expect(result.isPrimary).toBe(true)
        expect(mockSetCoverImageFn).toHaveBeenCalledWith('vendor-123', 'image-123')
      })

      it('should throw FORBIDDEN when vendor does not belong to the wedding', async () => {
        mockBelongsToWeddingFn.mockResolvedValue(false)

        await expect(
          vendorService.setCoverImage(actorContext, 'vendor-123', 'other-wedding', 'image-123')
        ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      })
    })

    describe('fetchWebsiteImages', () => {
      it('should return candidate image URLs for vendor with a website URL', async () => {
        const candidateUrls = ['https://alicephotos.com/og.jpg', 'https://alicephotos.com/hero.jpg']
        mockBelongsToWeddingFn.mockResolvedValue(true)
        mockFindByIdWithQuotesFn.mockResolvedValue(mockVendorWithQuotes)
        mockFetchWebsiteImages.mockResolvedValue(candidateUrls)

        const result = await vendorService.fetchVendorWebsiteImages(
          actorContext,
          'vendor-123',
          'wedding-123'
        )

        expect(result).toEqual(candidateUrls)
        expect(mockFetchWebsiteImages).toHaveBeenCalledWith(mockVendor.website)
      })

      it('should throw BAD_REQUEST when vendor has no website URL', async () => {
        mockBelongsToWeddingFn.mockResolvedValue(true)
        mockFindByIdWithQuotesFn.mockResolvedValue({
          ...mockVendorWithQuotes,
          website: null,
        })

        await expect(
          vendorService.fetchVendorWebsiteImages(actorContext, 'vendor-123', 'wedding-123')
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' })

        expect(mockFetchWebsiteImages).not.toHaveBeenCalled()
      })

      it('should throw FORBIDDEN when vendor does not belong to the wedding', async () => {
        mockBelongsToWeddingFn.mockResolvedValue(false)

        await expect(
          vendorService.fetchVendorWebsiteImages(actorContext, 'vendor-123', 'other-wedding')
        ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      })
    })
  })

  describe('setVendorRating', () => {
    it('upserts rating for vendor in wedding scope', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockSetRatingForUserFn.mockResolvedValue({
        vendorId: 'vendor-123',
        userId: 'actor-1',
        stars: 5,
      })

      const result = await vendorService.setVendorRating(
        actorContext,
        'vendor-123',
        'wedding-123',
        5
      )

      expect(result).toEqual({ vendorId: 'vendor-123', userId: 'actor-1', stars: 5 })
      expect(mockSetRatingForUserFn).toHaveBeenCalledWith('vendor-123', 'actor-1', 5)
    })

    it('throws FORBIDDEN when vendor is outside active wedding', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        vendorService.setVendorRating(actorContext, 'vendor-123', 'other-wedding', 5)
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      expect(mockSetRatingForUserFn).not.toHaveBeenCalled()
    })
  })

  // ─── deleteQuoteFile ────────────────────────────────────────────────────────

  describe('deleteQuoteFile', () => {
    const deleteInput = {
      fileId: 'file-123',
      quoteId: 'quote-123',
      vendorId: 'vendor-123',
    }

    it('should delete file and call del() with correct URL', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(true)
      mockFileBelongsToQuoteFn.mockResolvedValue(true)
      mockDeleteQuoteFileFn.mockResolvedValue(mockQuoteFile)

      const result = await vendorService.deleteQuoteFile(
        actorContext,
        'vendor-123',
        'wedding-123',
        deleteInput
      )

      expect(result).toEqual(mockQuoteFile)
      expect(mockDeleteQuoteFileFn).toHaveBeenCalledWith('file-123')
      expect(mockDel).toHaveBeenCalledWith([mockQuoteFile.url])
    })

    it('should still return deleted file when blob del() fails', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(true)
      mockFileBelongsToQuoteFn.mockResolvedValue(true)
      mockDeleteQuoteFileFn.mockResolvedValue(mockQuoteFile)
      mockDel.mockRejectedValue(new Error('Blob error'))

      const result = await vendorService.deleteQuoteFile(
        actorContext,
        'vendor-123',
        'wedding-123',
        deleteInput
      )

      expect(result).toEqual(mockQuoteFile)
    })

    it('should throw FORBIDDEN when vendor does not belong to wedding', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        vendorService.deleteQuoteFile(actorContext, 'vendor-123', 'other-wedding', deleteInput)
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('should throw FORBIDDEN when quote does not belong to vendor', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(false)

      await expect(
        vendorService.deleteQuoteFile(actorContext, 'vendor-123', 'wedding-123', deleteInput)
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('should throw FORBIDDEN when file does not belong to quote', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(true)
      mockFileBelongsToQuoteFn.mockResolvedValue(false)

      await expect(
        vendorService.deleteQuoteFile(actorContext, 'vendor-123', 'wedding-123', deleteInput)
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })
})
