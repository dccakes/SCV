/**
 * Vendor Repository - Jest Manual Mock
 *
 * Automatically used when jest.mock('~/server/domains/vendor/vendor.repository') is called.
 */

import { VendorCategory, VendorStatus } from '@prisma/client'

import type {
  Vendor,
  VendorCategoryConfig,
  VendorFieldDefinition,
  VendorNote,
  VendorQuote,
  VendorQuoteFile,
  VendorWithQuotes,
} from '~/server/domains/vendor/vendor.types'

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
  notes: null,
  contacted: false,
  customFields: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

export const mockVendorNote: VendorNote = {
  id: 'vendor-note-123',
  vendorId: 'vendor-123',
  weddingId: 'wedding-123',
  message: 'Sent first outreach email',
  actorType: 'couple',
  createdAt: new Date('2026-02-01'),
}

export const mockFieldDefinitions: VendorFieldDefinition[] = [
  {
    key: 'capacity',
    label: 'Capacity',
    type: 'number',
    displayOrder: 1,
  },
  {
    key: 'outdoor',
    label: 'Outdoor option',
    type: 'boolean',
    displayOrder: 2,
  },
]

export const mockVendorCategoryConfig: VendorCategoryConfig = {
  id: 'vendor-category-config-123',
  weddingId: null,
  category: VendorCategory.VENUE,
  fieldDefinitions: mockFieldDefinitions,
}

export const mockQuoteFile: VendorQuoteFile = {
  id: 'file-123',
  quoteId: 'quote-123',
  name: 'proposal.pdf',
  url: 'https://abc123.public.blob.vercel-storage.com/proposal.pdf',
  key: 'proposal.pdf',
  size: 102400,
  createdAt: new Date('2026-01-15'),
}

export const mockQuote: VendorQuote = {
  id: 'quote-123',
  vendorId: 'vendor-123',
  price: 2500,
  quoteType: 'FLAT_FEE',
  quoteDate: new Date('2026-02-01'),
  notes: 'Full day coverage',
  files: [mockQuoteFile],
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
export const mockCreateQuoteFiles = jest.fn()
export const mockDeleteQuoteFile = jest.fn()
export const mockFileBelongsToQuote = jest.fn()
export const mockFindAllFileUrlsByVendorId = jest.fn()
export const mockFindAllFileUrlsByQuoteId = jest.fn()
export const mockCountFilesByQuoteId = jest.fn()
export const mockFindById = jest.fn()
export const mockFindCustomFieldsById = jest.fn()
export const mockFindNotesByVendorId = jest.fn()
export const mockCreateVendorNote = jest.fn()
export const mockFindWeddingCategoryConfig = jest.fn()
export const mockFindSystemCategoryConfig = jest.fn()
export const mockFindCategoryConfig = jest.fn()
export const mockUpsertCategoryConfig = jest.fn()

export const VendorRepository = jest.fn().mockImplementation(() => ({
  findAllByWeddingId: mockFindAllByWeddingId,
  findAllByUserId: mockFindAllByUserId,
  findByIdWithQuotes: mockFindByIdWithQuotes,
  findById: mockFindById,
  findCustomFieldsById: mockFindCustomFieldsById,
  create: mockCreate,
  update: mockUpdate,
  updateStatus: mockUpdateStatus,
  delete: mockDelete,
  belongsToWedding: mockBelongsToWedding,
  createQuote: mockCreateQuote,
  updateQuote: mockUpdateQuote,
  deleteQuote: mockDeleteQuote,
  quoteBelongsToVendor: mockQuoteBelongsToVendor,
  createQuoteFiles: mockCreateQuoteFiles,
  deleteQuoteFile: mockDeleteQuoteFile,
  fileBelongsToQuote: mockFileBelongsToQuote,
  findAllFileUrlsByVendorId: mockFindAllFileUrlsByVendorId,
  findAllFileUrlsByQuoteId: mockFindAllFileUrlsByQuoteId,
  countFilesByQuoteId: mockCountFilesByQuoteId,
  findNotesByVendorId: mockFindNotesByVendorId,
  createVendorNote: mockCreateVendorNote,
  findWeddingCategoryConfig: mockFindWeddingCategoryConfig,
  findSystemCategoryConfig: mockFindSystemCategoryConfig,
  findCategoryConfig: mockFindCategoryConfig,
  upsertCategoryConfig: mockUpsertCategoryConfig,
}))

export const resetMocks = (): void => {
  mockFindAllByWeddingId.mockReset()
  mockFindAllByUserId.mockReset()
  mockFindByIdWithQuotes.mockReset()
  mockFindById.mockReset()
  mockFindCustomFieldsById.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockUpdateStatus.mockReset()
  mockDelete.mockReset()
  mockBelongsToWedding.mockReset()
  mockCreateQuote.mockReset()
  mockUpdateQuote.mockReset()
  mockDeleteQuote.mockReset()
  mockQuoteBelongsToVendor.mockReset()
  mockCreateQuoteFiles.mockReset()
  mockDeleteQuoteFile.mockReset()
  mockFileBelongsToQuote.mockReset()
  mockFindAllFileUrlsByVendorId.mockReset()
  mockFindAllFileUrlsByQuoteId.mockReset()
  mockCountFilesByQuoteId.mockReset()
  mockFindNotesByVendorId.mockReset()
  mockCreateVendorNote.mockReset()
  mockFindWeddingCategoryConfig.mockReset()
  mockFindSystemCategoryConfig.mockReset()
  mockFindCategoryConfig.mockReset()
  mockUpsertCategoryConfig.mockReset()
  VendorRepository.mockClear()
}
