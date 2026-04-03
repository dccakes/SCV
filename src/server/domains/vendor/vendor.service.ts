/**
 * Vendor Domain - Service
 *
 * Business logic for the Vendor domain.
 * Handles vendor and quote CRUD with ownership verification.
 */

import { TRPCError } from '@trpc/server'
import { del } from '@vercel/blob'

import { MAX_FILES_PER_QUOTE } from '~/lib/upload-config'

import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { VendorRepository } from '~/server/domains/vendor/vendor.repository'
import type {
  Vendor,
  VendorCategory,
  VendorQuote,
  VendorQuoteFile,
  VendorStatus,
  VendorWithQuotes,
} from '~/server/domains/vendor/vendor.types'
import type {
  CreateQuoteInput,
  CreateVendorInput,
  DeleteQuoteFileInput,
  SaveQuoteFilesInput,
  UpdateQuoteInput,
  UpdateVendorInput,
} from '~/server/domains/vendor/vendor.validator'

export class VendorService {
  constructor(private vendorRepository: VendorRepository) {}

  /**
   * Get all vendors for a wedding, optionally filtered by category
   *
   * Internal system method — no AuthzContext, no permission check.
   * Use getVendorsByUserId for user-facing calls. Do NOT call from routers directly.
   */
  async getVendors(weddingId: string, category?: VendorCategory): Promise<VendorWithQuotes[]> {
    return this.vendorRepository.findAllByWeddingId(weddingId, category)
  }

  /**
   * Get all vendors for a user's wedding in a single query (no separate weddingId lookup)
   */
  async getVendorsByUserId(
    ctx: AuthzContext,
    userId: string,
    category?: VendorCategory
  ): Promise<VendorWithQuotes[]> {
    this.requireVendorPermission(ctx, 'read')
    return this.vendorRepository.findAllByUserId(userId, category)
  }

  /**
   * Get all vendors for the active wedding scope.
   */
  async getVendorsForWedding(
    ctx: AuthzContext,
    weddingId: string,
    category?: VendorCategory
  ): Promise<VendorWithQuotes[]> {
    this.requireVendorPermission(ctx, 'read')
    return this.vendorRepository.findAllByWeddingId(weddingId, category)
  }

  /**
   * Get a vendor with its quotes, with ownership verification
   */
  async getVendorWithQuotes(
    ctx: AuthzContext,
    vendorId: string,
    weddingId: string
  ): Promise<VendorWithQuotes> {
    this.requireVendorPermission(ctx, 'read')

    const vendor = await this.vendorRepository.findByIdWithQuotes(vendorId)

    if (!vendor) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Vendor not found' })
    }

    if (vendor.weddingId !== weddingId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this vendor',
      })
    }

    return vendor
  }

  /**
   * Get a single quote with ownership verification
   */
  async getQuote(
    ctx: AuthzContext,
    quoteId: string,
    vendorId: string,
    weddingId: string
  ): Promise<VendorQuote> {
    this.requireVendorQuotePermission(ctx, 'read')
    await this.assertVendorOwnership(vendorId, weddingId)
    await this.assertQuoteOwnership(quoteId, vendorId)

    const vendor = await this.vendorRepository.findByIdWithQuotes(vendorId)
    const quote = vendor?.quotes.find((item) => item.id === quoteId)

    if (!quote) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Quote not found' })
    }

    return quote
  }

  /**
   * Create a new vendor for a wedding
   */
  async createVendor(
    ctx: AuthzContext,
    weddingId: string,
    data: CreateVendorInput
  ): Promise<Vendor> {
    this.requireVendorPermission(ctx, 'create')
    return this.vendorRepository.create({ ...data, weddingId })
  }

  /**
   * Update vendor details with ownership verification
   */
  async updateVendor(
    ctx: AuthzContext,
    vendorId: string,
    weddingId: string,
    data: UpdateVendorInput
  ): Promise<Vendor> {
    this.requireVendorPermission(ctx, 'update')
    await this.assertVendorOwnership(vendorId, weddingId)
    return this.vendorRepository.update(vendorId, data)
  }

  /**
   * Update vendor status with ownership verification
   */
  async updateStatus(
    ctx: AuthzContext,
    vendorId: string,
    weddingId: string,
    status: VendorStatus
  ): Promise<Vendor> {
    this.requireVendorPermission(ctx, 'update')
    await this.assertVendorOwnership(vendorId, weddingId)
    return this.vendorRepository.updateStatus(vendorId, status)
  }

  /**
   * Delete a vendor (cascades to quotes) with ownership verification.
   * Cleans up blob storage for all associated files before cascade-deleting.
   */
  async deleteVendor(ctx: AuthzContext, vendorId: string, weddingId: string): Promise<string> {
    this.requireVendorPermission(ctx, 'delete')
    await this.assertVendorOwnership(vendorId, weddingId)

    // Clean up blobs before cascade delete removes DB records
    const fileUrls = await this.vendorRepository.findAllFileUrlsByVendorId(vendorId)
    await this.deleteBlobsBestEffort(fileUrls)

    const deleted = await this.vendorRepository.delete(vendorId)
    return deleted.id
  }

  /**
   * Add a quote to a vendor with ownership verification
   */
  async addQuote(
    ctx: AuthzContext,
    vendorId: string,
    weddingId: string,
    data: CreateQuoteInput
  ): Promise<VendorQuote> {
    this.requireVendorQuotePermission(ctx, 'create')
    await this.assertVendorOwnership(vendorId, weddingId)
    return this.vendorRepository.createQuote({
      vendorId,
      price: data.price,
      quoteType: data.quoteType,
      quoteDate: new Date(data.quoteDate),
      notes: data.notes,
    })
  }

  /**
   * Update a quote with ownership verification
   */
  async updateQuote(
    ctx: AuthzContext,
    quoteId: string,
    vendorId: string,
    weddingId: string,
    data: UpdateQuoteInput
  ): Promise<VendorQuote> {
    this.requireVendorQuotePermission(ctx, 'update')
    await this.assertVendorOwnership(vendorId, weddingId)
    await this.assertQuoteOwnership(quoteId, vendorId)
    return this.vendorRepository.updateQuote(quoteId, {
      price: data.price,
      quoteType: data.quoteType,
      quoteDate: data.quoteDate ? new Date(data.quoteDate) : undefined,
      notes: data.notes,
    })
  }

  /**
   * Delete a quote with ownership verification.
   * Cleans up blob storage for all associated files before deleting.
   */
  async deleteQuote(
    ctx: AuthzContext,
    quoteId: string,
    vendorId: string,
    weddingId: string
  ): Promise<string> {
    this.requireVendorQuotePermission(ctx, 'delete')
    await this.assertVendorOwnership(vendorId, weddingId)
    await this.assertQuoteOwnership(quoteId, vendorId)

    // Clean up blobs before cascade delete removes file DB records
    const fileUrls = await this.vendorRepository.findAllFileUrlsByQuoteId(quoteId)
    await this.deleteBlobsBestEffort(fileUrls)

    const deleted = await this.vendorRepository.deleteQuote(quoteId)
    return deleted.id
  }

  // ─── Quote file operations ─────────────────────────────────────────────────

  /**
   * Save uploaded file metadata for a quote with ownership verification
   */
  async saveQuoteFiles(
    ctx: AuthzContext,
    vendorId: string,
    weddingId: string,
    data: SaveQuoteFilesInput
  ): Promise<VendorQuoteFile[]> {
    this.requireVendorQuotePermission(ctx, 'update')
    await this.assertVendorOwnership(vendorId, weddingId)
    await this.assertQuoteOwnership(data.quoteId, vendorId)

    // Enforce total file count per quote (existing + new)
    const existingCount = await this.vendorRepository.countFilesByQuoteId(data.quoteId)
    if (existingCount + data.files.length > MAX_FILES_PER_QUOTE) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `A quote can have at most ${MAX_FILES_PER_QUOTE} files (currently ${existingCount})`,
      })
    }

    return this.vendorRepository.createQuoteFiles(data.quoteId, data.files)
  }

  /**
   * Delete a single file from a quote with ownership verification.
   * Removes the blob from Vercel Blob storage after deleting the DB record.
   */
  async deleteQuoteFile(
    ctx: AuthzContext,
    vendorId: string,
    weddingId: string,
    data: DeleteQuoteFileInput
  ): Promise<VendorQuoteFile> {
    this.requireVendorQuotePermission(ctx, 'update')
    await this.assertVendorOwnership(vendorId, weddingId)
    await this.assertQuoteOwnership(data.quoteId, vendorId)
    await this.assertFileOwnership(data.fileId, data.quoteId)
    const deletedFile = await this.vendorRepository.deleteQuoteFile(data.fileId)
    await this.deleteBlobsBestEffort([deletedFile.url])
    return deletedFile
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Best-effort deletion of blob files. Failures are logged but do not
   * prevent the caller from completing (e.g. DB record deletion).
   */
  private async deleteBlobsBestEffort(urls: string[]): Promise<void> {
    if (urls.length === 0) return
    try {
      await del(urls)
    } catch {
      // biome-ignore lint/suspicious/noConsole: best-effort error logging
      console.error(`Failed to delete ${urls.length} blob file(s) during cleanup`)
    }
  }

  private async assertVendorOwnership(vendorId: string, weddingId: string): Promise<void> {
    const belongs = await this.vendorRepository.belongsToWedding(vendorId, weddingId)
    if (!belongs) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to modify this vendor',
      })
    }
  }

  private async assertQuoteOwnership(quoteId: string, vendorId: string): Promise<void> {
    const belongs = await this.vendorRepository.quoteBelongsToVendor(quoteId, vendorId)
    if (!belongs) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to modify this quote',
      })
    }
  }

  private async assertFileOwnership(fileId: string, quoteId: string): Promise<void> {
    const belongs = await this.vendorRepository.fileBelongsToQuote(fileId, quoteId)
    if (!belongs) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to modify this file',
      })
    }
  }

  private requireVendorPermission(
    ctx: AuthzContext,
    action: 'read' | 'create' | 'update' | 'delete'
  ): void {
    requirePermission(ctx, {
      vendor: [action],
    })
  }

  private requireVendorQuotePermission(
    ctx: AuthzContext,
    action: 'read' | 'create' | 'update' | 'delete'
  ): void {
    requirePermission(ctx, {
      vendor_quote: [action],
    })
  }
}
