/**
 * Vendor Repository - Jest Manual Mock
 *
 * Automatically used when jest.mock('~/server/domains/vendor/vendor.repository') is called.
 */

import { VendorCategory, VendorStatus } from '@prisma/client'

import { type Vendor, type VendorQuote, type VendorWithQuotes } from '~/server/domains/vendor/vendor.types'

export const mockVendor: Vendor = {
  id: 'vendor-123',
  weddingId: 'wedding-123',
  category: VendorCategory.PHOTOGRAPHER,
  name: 'Alice Photos',
  location: 'New York, NY',
  website: 'https://alicephotos.com',
  instagram: '@alicephotos',
  status: VendorStatus.IN_REVIEW,
  contactName: 'Alice Smith',
  contactEmail: 'alice@alicephotos.com',
  contactPhone: '+1234567890',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

export const mockQuote: VendorQuote = {
  id: 'quote-123',
  vendorId: 'vendor-123',
  price: 2500,
  quoteDate: new Date('2026-02-01'),
  notes: 'Full day coverage',
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
}

export const mockVendorWithQuotes: VendorWithQuotes = {
  ...mockVendor,
  quotes: [mockQuote],
}

export const mockFindAllByWeddingId = jest.fn()
export const mockFindAllByUserId = jest.fn()
export const mockFindByIdWithQuotes = jest.fn()
export const mockCreate = jest.fn()
export const mockUpdate = jest.fn()
export const mockUpdateStatus = jest.fn()
export const mockDelete = jest.fn()
export const mockBelongsToWedding = jest.fn()
export const mockCreateQuote = jest.fn()
export const mockUpdateQuote = jest.fn()
export const mockDeleteQuote = jest.fn()
export const mockQuoteBelongsToVendor = jest.fn()

export const VendorRepository = jest.fn().mockImplementation(() => ({
  findAllByWeddingId: mockFindAllByWeddingId,
  findAllByUserId: mockFindAllByUserId,
  findByIdWithQuotes: mockFindByIdWithQuotes,
  create: mockCreate,
  update: mockUpdate,
  updateStatus: mockUpdateStatus,
  delete: mockDelete,
  belongsToWedding: mockBelongsToWedding,
  createQuote: mockCreateQuote,
  updateQuote: mockUpdateQuote,
  deleteQuote: mockDeleteQuote,
  quoteBelongsToVendor: mockQuoteBelongsToVendor,
}))

export const resetMocks = (): void => {
  mockFindAllByWeddingId.mockReset()
  mockFindAllByUserId.mockReset()
  mockFindByIdWithQuotes.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockUpdateStatus.mockReset()
  mockDelete.mockReset()
  mockBelongsToWedding.mockReset()
  mockCreateQuote.mockReset()
  mockUpdateQuote.mockReset()
  mockDeleteQuote.mockReset()
  mockQuoteBelongsToVendor.mockReset()
  VendorRepository.mockClear()
}
