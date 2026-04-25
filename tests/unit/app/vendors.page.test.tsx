import { render, screen } from '@testing-library/react'

import VendorsPage from '~/app/(authenicated)/vendors/page'

const mockGetVendors = jest.fn()
const mockGetPendingByDomain = jest.fn()
const mockGetRequiredWedding = jest.fn()
const mockRedirect = jest.fn()
const mockVendorList = jest.fn(
  (_props: { initialSuggestions: unknown[]; initialVendors: unknown[] }) => (
    <div data-testid='vendor-list'>Vendor list</div>
  )
)
const mockDashboardTopbar = jest.fn(
  (_props: { title?: string; showManagementActions?: boolean }) => (
    <header data-testid='dashboard-topbar'>Topbar</header>
  )
)

jest.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}))

jest.mock('~/trpc/server', () => ({
  api: {
    vendor: {
      getAll: () => mockGetVendors(),
    },
    etta: {
      getPendingByDomain: (...args: unknown[]) => mockGetPendingByDomain(...args),
    },
  },
}))

jest.mock('~/server/application/authenticated-route/authenticated-route-data', () => ({
  getRequiredWedding: () => mockGetRequiredWedding(),
}))

jest.mock('~/components/vendor', () => ({
  __esModule: true,
  default: (props: { initialSuggestions: unknown[]; initialVendors: unknown[] }) =>
    mockVendorList(props),
}))

jest.mock('~/components/dashboard/dashboard-topbar', () => ({
  __esModule: true,
  default: (props: { title?: string; showManagementActions?: boolean }) =>
    mockDashboardTopbar(props),
}))

describe('VendorsPage', () => {
  beforeEach(() => {
    mockGetVendors.mockReset()
    mockGetPendingByDomain.mockReset()
    mockGetPendingByDomain.mockResolvedValue([])
    mockGetRequiredWedding.mockReset()
    mockGetRequiredWedding.mockResolvedValue({ id: 'wedding-123' })
    mockRedirect.mockReset()
    mockVendorList.mockClear()
    mockDashboardTopbar.mockClear()
  })

  it('fetches vendors on server and passes initialVendors to VendorList', async () => {
    const vendors = [{ id: 1, name: 'Photographer' }]
    const suggestions = [{ id: 'suggestion-1', summary: 'Add Sunset Florals' }]
    mockGetVendors.mockResolvedValue(vendors)
    mockGetPendingByDomain.mockResolvedValue(suggestions)

    const page = await VendorsPage()
    render(page)

    expect(mockGetVendors).toHaveBeenCalledTimes(1)
    expect(mockGetPendingByDomain).toHaveBeenCalledWith({ domain: 'vendors' })
    expect(mockVendorList).toHaveBeenCalledWith({
      initialVendors: vendors,
      initialSuggestions: suggestions,
    })
    expect(screen.getByTestId('vendor-list')).toBeInTheDocument()
  })

  it('redirects to root when vendors query returns null', async () => {
    mockGetVendors.mockResolvedValue(null)

    await VendorsPage()

    expect(mockRedirect).toHaveBeenCalledWith('/')
    expect(mockVendorList).not.toHaveBeenCalled()
  })

  it('renders dashboard topbar and authenticated page shell', async () => {
    mockGetVendors.mockResolvedValue([])

    const page = await VendorsPage()
    const { container } = render(page)

    expect(mockDashboardTopbar).toHaveBeenCalledWith({
      title: 'Vendors',
      showManagementActions: false,
    })
    expect(screen.getByTestId('dashboard-topbar')).toBeInTheDocument()
    expect(
      container.querySelector('main.min-h-0.flex-1.overflow-y-auto.px-4.py-5.lg\\:px-6.lg\\:py-6')
    ).toBeTruthy()
  })
})
