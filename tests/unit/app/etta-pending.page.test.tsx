import { render, screen } from '@testing-library/react'

import EttaPendingPage from '~/app/(authenicated)/etta/pending/page'

const mockGetAllSuggestions = jest.fn()
const mockPendingSuggestionsFeed = jest.fn(({ suggestions }: { suggestions: unknown[] }) => (
  <div data-testid='pending-suggestions-feed'>{suggestions.length}</div>
))
const mockDashboardTopbar = jest.fn(
  (_props: { title?: string; showManagementActions?: boolean }) => (
    <header data-testid='dashboard-topbar'>Topbar</header>
  )
)

jest.mock('~/trpc/server', () => ({
  api: {
    etta: {
      getAll: (input: Record<string, never>) => mockGetAllSuggestions(input),
    },
  },
}))

jest.mock('~/components/etta/PendingSuggestionsFeed', () => ({
  PendingSuggestionsFeed: ({ suggestions }: { suggestions: unknown[] }) =>
    mockPendingSuggestionsFeed({ suggestions }),
}))

jest.mock('~/components/dashboard/dashboard-topbar', () => ({
  __esModule: true,
  default: (props: { title?: string; showManagementActions?: boolean }) =>
    mockDashboardTopbar(props),
}))

describe('EttaPendingPage', () => {
  beforeEach(() => {
    mockGetAllSuggestions.mockReset()
    mockPendingSuggestionsFeed.mockClear()
    mockDashboardTopbar.mockClear()
  })

  it('fetches all suggestions on the server and passes them to the inbox feed', async () => {
    const suggestions = [{ id: 'suggestion-1' }, { id: 'suggestion-2' }]
    mockGetAllSuggestions.mockResolvedValue(suggestions)

    const page = await EttaPendingPage()
    render(page)

    expect(mockGetAllSuggestions).toHaveBeenCalledWith({})
    expect(mockPendingSuggestionsFeed).toHaveBeenCalledWith({ suggestions })
    expect(screen.getByTestId('pending-suggestions-feed')).toBeInTheDocument()
  })

  it('renders the authenticated page shell for the inbox', async () => {
    mockGetAllSuggestions.mockResolvedValue([])

    const page = await EttaPendingPage()
    const { container } = render(page)

    expect(mockDashboardTopbar).toHaveBeenCalledWith({
      title: 'Etta Inbox',
      showManagementActions: false,
    })
    expect(screen.getByTestId('dashboard-topbar')).toBeInTheDocument()
    expect(
      container.querySelector('main.min-h-0.flex-1.overflow-y-auto.px-4.py-5.lg\\:px-6.lg\\:py-6')
    ).toBeTruthy()
  })
})
