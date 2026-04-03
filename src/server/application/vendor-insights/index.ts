import { VendorInsightsService } from '~/server/application/vendor-insights/vendor-insights.service'
import { vendorService } from '~/server/domains/vendor'

export const vendorInsightsService = new VendorInsightsService(vendorService)

export { VendorInsightsService } from '~/server/application/vendor-insights/vendor-insights.service'
