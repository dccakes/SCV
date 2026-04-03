import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { VendorService } from '~/server/domains/vendor/vendor.service'
import type {
  VendorCategory,
  VendorQuote,
  VendorWithQuotes,
} from '~/server/domains/vendor/vendor.types'

export class VendorInsightsService {
  constructor(
    private vendorService: Pick<
      VendorService,
      'getQuote' | 'getVendorsForWedding' | 'getVendorWithQuotes'
    >
  ) {}

  async listVendors(
    authz: AuthzContext,
    weddingId: string,
    category?: VendorCategory
  ): Promise<VendorWithQuotes[]> {
    requirePermission(authz, { vendor: ['read'] })
    return this.vendorService.getVendorsForWedding(authz, weddingId, category)
  }

  async getVendor(
    authz: AuthzContext,
    weddingId: string,
    vendorId: string
  ): Promise<VendorWithQuotes> {
    requirePermission(authz, { vendor: ['read'] })
    return this.vendorService.getVendorWithQuotes(authz, vendorId, weddingId)
  }

  async getQuote(
    authz: AuthzContext,
    weddingId: string,
    vendorId: string,
    quoteId: string
  ): Promise<VendorQuote> {
    requirePermission(authz, { vendor_quote: ['read'] })
    return this.vendorService.getQuote(authz, quoteId, vendorId, weddingId)
  }
}
