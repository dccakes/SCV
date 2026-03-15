/**
 * Vendor Domain - Repository
 *
 * Database operations for the Vendor and VendorQuote entities.
 */

import {
  Prisma,
  type PrismaClient,
  type VendorQuote as PrismaVendorQuote,
  type VendorQuoteFile as PrismaVendorQuoteFile,
  type VendorCategory,
  type VendorStatus,
} from '@prisma/client'

import type {
  Vendor,
  VendorQuote,
  VendorQuoteFile,
  VendorWithQuotes,
} from '~/server/domains/vendor/vendor.types'

export class VendorRepository {
  constructor(private db: PrismaClient) {}

  /**
   * Find all vendors for a wedding (with latest quote), optionally filtered by category
   */
  async findAllByWeddingId(
    weddingId: string,
    category?: VendorCategory
  ): Promise<VendorWithQuotes[]> {
    const rows = await this.db.vendor.findMany({
      where: { weddingId, ...(category ? { category } : {}) },
      include: { quotes: { include: { files: true }, orderBy: { quoteDate: 'desc' } } },
      orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
    })
    return rows.map(this.serializeVendorWithQuotes)
  }

  /**
   * Find all vendors for a user's wedding in a single JOIN query (avoids N+1 weddingId lookup)
   */
  async findAllByUserId(userId: string, category?: VendorCategory): Promise<VendorWithQuotes[]> {
    const rows = await this.db.vendor.findMany({
      where: {
        wedding: { userWeddings: { some: { userId } } },
        ...(category ? { category } : {}),
      },
      include: { quotes: { include: { files: true }, orderBy: { quoteDate: 'desc' } } },
      orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
    })
    return rows.map(this.serializeVendorWithQuotes)
  }

  /**
   * Find a vendor by ID including all quotes
   */
  async findByIdWithQuotes(id: string): Promise<VendorWithQuotes | null> {
    const row = await this.db.vendor.findUnique({
      where: { id },
      include: { quotes: { include: { files: true }, orderBy: { quoteDate: 'desc' } } },
    })
    if (!row) return null
    return this.serializeVendorWithQuotes(row)
  }

  /**
   * Create a new vendor
   */
  async create(data: {
    weddingId: string
    category: VendorCategory
    name: string
    location?: string
    website?: string
    instagram?: string
    contactName?: string
    contactEmail?: string
    contactPhone?: string
  }): Promise<Vendor> {
    return this.db.vendor.create({ data })
  }

  /**
   * Update vendor fields (contact, location, social links, etc.)
   */
  async update(
    id: string,
    data: {
      name?: string
      location?: string
      website?: string
      instagram?: string
      contactName?: string
      contactEmail?: string
      contactPhone?: string
    }
  ): Promise<Vendor> {
    return this.db.vendor.update({ where: { id }, data })
  }

  /**
   * Update vendor status only
   */
  async updateStatus(id: string, status: VendorStatus): Promise<Vendor> {
    return this.db.vendor.update({ where: { id }, data: { status } })
  }

  /**
   * Find all file URLs belonging to a vendor (across all quotes).
   * Used for blob cleanup before cascade-deleting a vendor.
   */
  async findAllFileUrlsByVendorId(vendorId: string): Promise<string[]> {
    const files = await this.db.vendorQuoteFile.findMany({
      where: { quote: { vendorId } },
      select: { url: true },
    })
    return files.map((f) => f.url)
  }

  /**
   * Find all file URLs for a specific quote.
   * Used for blob cleanup before deleting a quote.
   */
  async findAllFileUrlsByQuoteId(quoteId: string): Promise<string[]> {
    const files = await this.db.vendorQuoteFile.findMany({
      where: { quoteId },
      select: { url: true },
    })
    return files.map((f) => f.url)
  }

  /**
   * Delete a vendor (cascades to quotes via DB)
   */
  async delete(id: string): Promise<Vendor> {
    return this.db.vendor.delete({ where: { id } })
  }

  /**
   * Check if a vendor belongs to a wedding
   */
  async belongsToWedding(id: string, weddingId: string): Promise<boolean> {
    const vendor = await this.db.vendor.findFirst({
      where: { id, weddingId },
      select: { id: true },
    })
    return vendor !== null
  }

  /**
   * Create a new quote for a vendor
   */
  async createQuote(data: {
    vendorId: string
    price: number
    quoteDate: Date
    notes?: string
  }): Promise<VendorQuote> {
    const row = await this.db.vendorQuote.create({
      data: { ...data, price: new Prisma.Decimal(data.price) },
      include: { files: true },
    })
    return this.serializeQuote(row)
  }

  /**
   * Update a quote
   */
  async updateQuote(
    id: string,
    data: {
      price?: number
      quoteDate?: Date
      notes?: string
    }
  ): Promise<VendorQuote> {
    const row = await this.db.vendorQuote.update({
      where: { id },
      data: {
        ...data,
        ...(data.price !== undefined ? { price: new Prisma.Decimal(data.price) } : {}),
      },
      include: { files: true },
    })
    return this.serializeQuote(row)
  }

  /**
   * Delete a quote
   */
  async deleteQuote(id: string): Promise<VendorQuote> {
    const row = await this.db.vendorQuote.delete({ where: { id }, include: { files: true } })
    return this.serializeQuote(row)
  }

  /**
   * Check if a quote belongs to a vendor
   */
  async quoteBelongsToVendor(quoteId: string, vendorId: string): Promise<boolean> {
    const quote = await this.db.vendorQuote.findFirst({
      where: { id: quoteId, vendorId },
      select: { id: true },
    })
    return quote !== null
  }

  // ─── Quote file operations ────────────────────────────────────────────────

  /**
   * Count existing files for a quote
   */
  async countFilesByQuoteId(quoteId: string): Promise<number> {
    return this.db.vendorQuoteFile.count({ where: { quoteId } })
  }

  /**
   * Create file records for a quote (batch)
   */
  async createQuoteFiles(
    quoteId: string,
    files: { name: string; url: string; key: string; size: number }[]
  ): Promise<VendorQuoteFile[]> {
    return this.db.$transaction(async (tx) => {
      await tx.vendorQuoteFile.createMany({
        data: files.map((f) => ({ ...f, quoteId })),
      })
      return tx.vendorQuoteFile.findMany({
        where: { quoteId },
        orderBy: { createdAt: 'desc' },
      })
    })
  }

  /**
   * Delete a single file record
   */
  async deleteQuoteFile(fileId: string): Promise<VendorQuoteFile> {
    return this.db.vendorQuoteFile.delete({ where: { id: fileId } })
  }

  /**
   * Check if a file belongs to a quote
   */
  async fileBelongsToQuote(fileId: string, quoteId: string): Promise<boolean> {
    const file = await this.db.vendorQuoteFile.findFirst({
      where: { id: fileId, quoteId },
      select: { id: true },
    })
    return file !== null
  }

  // ─── Private serializers ────────────────────────────────────────────────────

  private serializeQuote(row: PrismaVendorQuote & { files: PrismaVendorQuoteFile[] }): VendorQuote {
    return { ...row, price: parseFloat(row.price.toString()) }
  }

  private serializeVendorWithQuotes = (
    row: Vendor & { quotes: (PrismaVendorQuote & { files: PrismaVendorQuoteFile[] })[] }
  ): VendorWithQuotes => {
    return { ...row, quotes: row.quotes.map((q) => this.serializeQuote(q)) }
  }
}
