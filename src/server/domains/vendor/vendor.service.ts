/**
 * Vendor Domain - Service
 *
 * Business logic for the Vendor domain.
 * Handles vendor and quote CRUD with ownership verification.
 */

import { TRPCError } from '@trpc/server'
import { del } from '@vercel/blob'

import { MAX_FILES_PER_QUOTE, MAX_IMAGES_PER_VENDOR } from '~/lib/upload-config'

import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { VendorRepository } from '~/server/domains/vendor/vendor.repository'
import type {
  Vendor,
  VendorCategory,
  VendorCategoryConfig,
  VendorFieldDefinition,
  VendorImage,
  VendorNote,
  VendorNoteActorType,
  VendorQuote,
  VendorQuoteFile,
  VendorRatingRecord,
  VendorStatus,
  VendorWithQuotes,
} from '~/server/domains/vendor/vendor.types'
import type {
  AddVendorNoteInput,
  CreateQuoteInput,
  CreateVendorInput,
  DeleteQuoteFileInput,
  SaveQuoteFilesInput,
  SaveVendorImagesInput,
  UpdateQuoteInput,
  UpdateVendorInput,
} from '~/server/domains/vendor/vendor.validator'
import { upsertCategoryConfigSchema } from '~/server/domains/vendor/vendor.validator'
import { fetchWebsiteImages } from '~/server/infrastructure/scraper/website-images'

export class VendorService {
  constructor(private vendorRepository: VendorRepository) {}

  /**
   * Get all vendors for a wedding, optionally filtered by category
   *
   * Internal system method — no AuthzContext, no permission check.
   * Use getVendorsByUserId for user-facing calls. Do NOT call from routers directly.
   */
  // System-only read path. App and Etta planner flows should use permissioned methods.
  async getVendorsSystem(
    weddingId: string,
    category?: VendorCategory
  ): Promise<VendorWithQuotes[]> {
    return this.vendorRepository.findAllByWeddingId(weddingId, category)
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
    const vendors = await this.vendorRepository.findAllByWeddingId(weddingId, category)
    return vendors.map((vendor) => ({
      ...vendor,
      ratingSummary: {
        ...vendor.ratingSummary,
        currentUserRating:
          vendor.ratingSummary.ratings.find((rating) => rating.userId === ctx.userId)?.stars ??
          null,
      },
    }))
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

    return {
      ...vendor,
      ratingSummary: {
        ...vendor.ratingSummary,
        currentUserRating:
          vendor.ratingSummary.ratings.find((rating) => rating.userId === ctx.userId)?.stars ??
          null,
      },
    }
  }

  async setVendorRating(
    ctx: AuthzContext,
    vendorId: string,
    weddingId: string,
    stars: number
  ): Promise<VendorRatingRecord> {
    this.requireVendorPermission(ctx, 'read')
    await this.assertVendorOwnership(vendorId, weddingId)
    return this.vendorRepository.setRatingForUser(vendorId, ctx.userId, stars)
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

    const { vendorId: _, customFields, notes, ...updateData } = data
    const normalizedNotes = notes === undefined ? undefined : notes?.trim() ? notes : null
    const mergedCustomFields =
      customFields === undefined
        ? undefined
        : customFields === null
          ? null
          : {
              ...(await this.vendorRepository.findCustomFieldsById(vendorId)),
              ...customFields,
            }

    return this.vendorRepository.update(vendorId, {
      ...updateData,
      ...(normalizedNotes !== undefined ? { notes: normalizedNotes } : {}),
      ...(mergedCustomFields !== undefined ? { customFields: mergedCustomFields } : {}),
    })
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

  async addVendorNote(
    ctx: AuthzContext,
    vendorId: string,
    weddingId: string,
    message: AddVendorNoteInput['message'],
    actorType: VendorNoteActorType = 'couple'
  ): Promise<VendorNote> {
    this.requireVendorPermission(ctx, 'update')
    await this.assertVendorOwnership(vendorId, weddingId)

    const trimmedMessage = message.trim()
    if (trimmedMessage.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Message is required',
      })
    }

    return this.vendorRepository.createVendorNote({
      vendorId,
      weddingId,
      message: trimmedMessage,
      actorType,
    })
  }

  async getNotes(ctx: AuthzContext, vendorId: string, weddingId: string): Promise<VendorNote[]> {
    this.requireVendorPermission(ctx, 'read')
    await this.assertVendorOwnership(vendorId, weddingId)
    return this.vendorRepository.findNotesByVendorId(vendorId)
  }

  async getCategoryConfig(
    ctx: AuthzContext,
    weddingId: string,
    category: VendorCategory
  ): Promise<VendorCategoryConfig> {
    this.requireVendorPermission(ctx, 'read')

    const categoryConfig = await this.vendorRepository.findCategoryConfig(weddingId, category)
    if (!categoryConfig) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Vendor category config not found',
      })
    }

    return categoryConfig
  }

  async upsertCategoryConfig(
    ctx: AuthzContext,
    weddingId: string,
    category: VendorCategory,
    fieldDefinitions: VendorFieldDefinition[]
  ): Promise<VendorCategoryConfig> {
    this.requireVendorPermission(ctx, 'update')
    upsertCategoryConfigSchema.parse({
      category,
      fieldDefinitions,
    })
    return this.vendorRepository.upsertCategoryConfig({
      weddingId,
      category,
      fieldDefinitions,
    })
  }

  /**
   * Delete a vendor (cascades to quotes) with ownership verification.
   * Cleans up blob storage for all associated files and images before cascade-deleting.
   */
  async deleteVendor(ctx: AuthzContext, vendorId: string, weddingId: string): Promise<string> {
    this.requireVendorPermission(ctx, 'delete')
    await this.assertVendorOwnership(vendorId, weddingId)

    const vendor = await this.vendorRepository.findByIdWithQuotes(vendorId)
    const fileUrls = (vendor?.quotes ?? []).flatMap((q) => q.files.map((f) => f.url))
    const imageUrls = (vendor?.images ?? []).map((img) => img.url)
    await this.deleteBlobsBestEffort([...fileUrls, ...imageUrls])

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

  // ─── Vendor image operations ───────────────────────────────────────────────

  /**
   * Save uploaded image metadata for a vendor with ownership verification.
   * Enforces a per-vendor image limit of MAX_IMAGES_PER_VENDOR.
   */
  async saveImages(
    ctx: AuthzContext,
    vendorId: string,
    weddingId: string,
    data: SaveVendorImagesInput
  ): Promise<VendorImage[]> {
    this.requireVendorPermission(ctx, 'update')
    await this.assertVendorOwnership(vendorId, weddingId)

    // Enforce total image count (existing + new)
    const vendor = await this.vendorRepository.findByIdWithQuotes(vendorId)
    const existingCount = vendor?.images.length ?? 0
    if (existingCount + data.images.length > MAX_IMAGES_PER_VENDOR) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `A vendor can have at most ${MAX_IMAGES_PER_VENDOR} images (currently ${existingCount})`,
      })
    }

    return this.vendorRepository.saveImages(vendorId, data.images)
  }

  /**
   * Delete a single image from a vendor with ownership verification.
   * Removes the blob from Vercel Blob storage after deleting the DB record.
   */
  async deleteImage(
    ctx: AuthzContext,
    vendorId: string,
    weddingId: string,
    imageId: string
  ): Promise<string> {
    this.requireVendorPermission(ctx, 'update')
    await this.assertVendorOwnership(vendorId, weddingId)

    const deleted = await this.vendorRepository.deleteImage(imageId)
    await this.deleteBlobsBestEffort([deleted.url])
    return deleted.id
  }

  /**
   * Set the cover (primary) image for a vendor with ownership verification.
   */
  async setCoverImage(
    ctx: AuthzContext,
    vendorId: string,
    weddingId: string,
    imageId: string
  ): Promise<VendorImage> {
    this.requireVendorPermission(ctx, 'update')
    await this.assertVendorOwnership(vendorId, weddingId)
    return this.vendorRepository.setCoverImage(vendorId, imageId)
  }

  /**
   * Fetch candidate image URLs from a vendor's website for the couple to review.
   */
  async fetchVendorWebsiteImages(
    ctx: AuthzContext,
    vendorId: string,
    weddingId: string
  ): Promise<string[]> {
    this.requireVendorPermission(ctx, 'read')
    await this.assertVendorOwnership(vendorId, weddingId)

    const vendor = await this.vendorRepository.findByIdWithQuotes(vendorId)
    if (!vendor?.website) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Vendor does not have a website URL',
      })
    }

    return fetchWebsiteImages(vendor.website)
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
