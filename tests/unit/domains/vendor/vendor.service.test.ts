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

import { del } from '@vercel/blob'

import { requirePermission } from '~/server/authz/permission-checker'
// @ts-expect-error - Importing mock functions from mocked module
import {
  mockBelongsToWedding,
  mockCountFilesByQuoteId,
  mockCreate,
  mockCreateQuote,
  mockCreateQuoteFiles,
  mockDelete,
  mockDeleteQuote,
  mockDeleteQuoteFile,
  mockFileBelongsToQuote,
  mockFindAllByWeddingId,
  mockFindAllFileUrlsByQuoteId,
  mockFindAllFileUrlsByVendorId,
  mockFindByIdWithQuotes,
  mockQuote,
  mockQuoteBelongsToVendor,
  mockQuoteFile,
  mockUpdate,
  mockUpdateQuote,
  mockUpdateStatus,
  mockVendor,
  mockVendorWithQuotes,
  resetMocks,
  VendorRepository,
} from '~/server/domains/vendor/vendor.repository'
import { VendorService } from '~/server/domains/vendor/vendor.service'

const mockFindAllByWeddingIdFn = mockFindAllByWeddingId as jest.Mock
const mockFindByIdWithQuotesFn = mockFindByIdWithQuotes as jest.Mock
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
const mockFindAllFileUrlsByVendorIdFn = mockFindAllFileUrlsByVendorId as jest.Mock
const mockFindAllFileUrlsByQuoteIdFn = mockFindAllFileUrlsByQuoteId as jest.Mock
const mockCountFilesByQuoteIdFn = mockCountFilesByQuoteId as jest.Mock
const mockDel = del as jest.Mock

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

      const result = await vendorService.getVendors('wedding-123')

      expect(result).toEqual([mockVendorWithQuotes])
      expect(mockFindAllByWeddingIdFn).toHaveBeenCalledWith('wedding-123', undefined)
    })

    it('should filter by category when provided', async () => {
      mockFindAllByWeddingIdFn.mockResolvedValue([mockVendorWithQuotes])

      await vendorService.getVendors('wedding-123', VendorCategory.PHOTOGRAPHER)

      expect(mockFindAllByWeddingIdFn).toHaveBeenCalledWith(
        'wedding-123',
        VendorCategory.PHOTOGRAPHER
      )
    })

    it('should return empty array when no vendors exist', async () => {
      mockFindAllByWeddingIdFn.mockResolvedValue([])

      const result = await vendorService.getVendors('wedding-123')

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
      mockFindAllFileUrlsByVendorIdFn.mockResolvedValue([])
      mockDeleteFn.mockResolvedValue(mockVendor)

      const result = await vendorService.deleteVendor(actorContext, 'vendor-123', 'wedding-123')

      expect(result).toBe('vendor-123')
      expect(mockDeleteFn).toHaveBeenCalledWith('vendor-123')
    })

    it('should clean up blob files before cascade delete', async () => {
      const urls = [
        'https://abc.public.blob.vercel-storage.com/file1.pdf',
        'https://abc.public.blob.vercel-storage.com/file2.pdf',
      ]
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockFindAllFileUrlsByVendorIdFn.mockResolvedValue(urls)
      mockDeleteFn.mockResolvedValue(mockVendor)

      await vendorService.deleteVendor(actorContext, 'vendor-123', 'wedding-123')

      expect(mockDel).toHaveBeenCalledWith(urls)
      expect(mockDeleteFn).toHaveBeenCalledWith('vendor-123')
    })

    it('should still delete vendor when blob cleanup fails', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockFindAllFileUrlsByVendorIdFn.mockResolvedValue([
        'https://x.public.blob.vercel-storage.com/f.pdf',
      ])
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

      const result = await vendorService.deleteQuote('quote-123', 'vendor-123', 'wedding-123')

      expect(result).toBe('quote-123')
    })

    it('should clean up blob files before deleting quote', async () => {
      const urls = ['https://abc.public.blob.vercel-storage.com/proposal.pdf']
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockQuoteBelongsToVendorFn.mockResolvedValue(true)
      mockFindAllFileUrlsByQuoteIdFn.mockResolvedValue(urls)
      mockDeleteQuoteFn.mockResolvedValue(mockQuote)

      await vendorService.deleteQuote('quote-123', 'vendor-123', 'wedding-123')

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
      mockFindAllFileUrlsByVendorIdFn.mockResolvedValue([])
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
