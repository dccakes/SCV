import { TRPCError } from '@trpc/server'
import { VendorInsightsService } from '~/server/application/vendor-insights/vendor-insights.service'
import type { AuthzContext } from '~/server/authz/authorization.types'

jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

describe('VendorInsightsService', () => {
  const buildAuthz = (role: 'owner' | 'admin' | 'member' | 'viewer'): AuthzContext => ({
    userId: 'user-1',
    activeOrganization: { organizationId: 'org-1', role },
  })

  const vendorService = {
    getQuote: jest.fn(),
    getVendorsForWedding: jest.fn(),
  }

  const service = new VendorInsightsService(vendorService)

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('lists vendors for member role', async () => {
    vendorService.getVendorsForWedding.mockResolvedValue([{ id: 'vendor-1' }])
    const result = await service.listVendors(buildAuthz('member'), 'wedding-1')
    expect(result).toEqual([{ id: 'vendor-1' }])
    expect(vendorService.getVendorsForWedding).toHaveBeenCalledWith(
      { userId: 'user-1', activeOrganization: { organizationId: 'org-1', role: 'member' } },
      'wedding-1',
      undefined
    )
  })

  it('rejects vendor list for viewer role', async () => {
    await expect(service.listVendors(buildAuthz('viewer'), 'wedding-1')).rejects.toThrow(TRPCError)
  })

  it('reads quote for member role', async () => {
    vendorService.getQuote.mockResolvedValue({ id: 'quote-1' })
    const result = await service.getQuote(buildAuthz('member'), 'wedding-1', 'vendor-1', 'quote-1')
    expect(result).toEqual({ id: 'quote-1' })
    expect(vendorService.getQuote).toHaveBeenCalledWith(
      { userId: 'user-1', activeOrganization: { organizationId: 'org-1', role: 'member' } },
      'quote-1',
      'vendor-1',
      'wedding-1'
    )
  })
})
