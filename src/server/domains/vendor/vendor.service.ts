/**
 * Vendor Domain - Service
 *
 * Business logic for the Vendor domain.
 * Handles vendor and quote CRUD with ownership verification.
 */

import { TRPCError } from '@trpc/server'

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
    await this.requireVendorPermission(ctx, 'read')
    return this.vendorRepository.findAllByUserId(userId, category)
  }

  /**
   * Get a vendor with its quotes, with ownership verification
   */
  async getVendorWithQuotes(
    ctx: AuthzContext,
    vendorId: string,
    weddingId: string
  ): Promise<VendorWithQuotes> {
    await this.requireVendorPermission(ctx, 'read')

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
   * Create a new vendor for a wedding
   */
  async createVendor(
    ctx: AuthzContext,
    weddingId: string,
    data: CreateVendorInput
  ): Promise<Vendor> {
    await this.requireVendorPermission(ctx, 'create')
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
    await this.requireVendorPermission(ctx, 'update')
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
    await this.requireVendorPermission(ctx, 'update')
    await this.assertVendorOwnership(vendorId, weddingId)
    return this.vendorRepository.updateStatus(vendorId, status)
  }

  /**
   * Delete a vendor (cascades to quotes) with ownership verification
   */
  async deleteVendor(ctx: AuthzContext, vendorId: string, weddingId: string): Promise<string> {
    await this.requireVendorPermission(ctx, 'delete')
    await this.assertVendorOwnership(vendorId, weddingId)
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
    await this.requireVendorQuotePermission(ctx, 'create')
    await this.assertVendorOwnership(vendorId, weddingId)
    return this.vendorRepository.createQuote({
      vendorId,
      price: data.price,
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
    await this.requireVendorQuotePermission(ctx, 'update')
    await this.assertVendorOwnership(vendorId, weddingId)
    await this.assertQuoteOwnership(quoteId, vendorId)
    return this.vendorRepository.updateQuote(quoteId, {
      price: data.price,
      quoteDate: data.quoteDate ? new Date(data.quoteDate) : undefined,
      notes: data.notes,
    })
  }

  /**
   * Delete a quote with ownership verification
   */
  async deleteQuote(
    ctx: AuthzContext,
    quoteId: string,
    vendorId: string,
    weddingId: string
  ): Promise<string> {
    await this.requireVendorQuotePermission(ctx, 'delete')
    await this.assertVendorOwnership(vendorId, weddingId)
    await this.assertQuoteOwnership(quoteId, vendorId)
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
    await this.requireVendorQuotePermission(ctx, 'update')
    await this.assertVendorOwnership(vendorId, weddingId)
    await this.assertQuoteOwnership(data.quoteId, vendorId)
    return this.vendorRepository.createQuoteFiles(data.quoteId, data.files)
  }

  /**
   * Delete a single file from a quote with ownership verification.
   * Returns the deleted file's key for removal from UploadThing storage.
   */
  async deleteQuoteFile(
    ctx: AuthzContext,
    vendorId: string,
    weddingId: string,
    data: DeleteQuoteFileInput
  ): Promise<VendorQuoteFile> {
    await this.requireVendorQuotePermission(ctx, 'update')
    await this.assertVendorOwnership(vendorId, weddingId)
    await this.assertQuoteOwnership(data.quoteId, vendorId)
    await this.assertFileOwnership(data.fileId, data.quoteId)
    return this.vendorRepository.deleteQuoteFile(data.fileId)
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

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

  private async requireVendorPermission(
    ctx: AuthzContext,
    action: 'read' | 'create' | 'update' | 'delete'
  ): Promise<void> {
    await requirePermission(ctx, {
      vendor: [action],
    })
  }

  private async requireVendorQuotePermission(
    ctx: AuthzContext,
    action: 'read' | 'create' | 'update' | 'delete'
  ): Promise<void> {
    await requirePermission(ctx, {
      vendor_quote: [action],
    })
  }
}
