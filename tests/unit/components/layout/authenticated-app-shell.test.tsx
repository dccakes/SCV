import { render, screen } from '@testing-library/react'

import AuthenticatedAppShell from '~/components/layout/authenticated-app-shell'

const mockEttaChat = jest.fn(() => <div data-testid='etta-chat' />)
const mockSidebarNavFrame = jest.fn(() => <div data-testid='sidebar-state'>closed</div>)
const mockUsePendingCountsQuery = jest.fn()

jest.mock('~/components/nav/sidebar-nav', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockSidebarNavFrame(props)
    return <div data-testid='sidebar-state'>{props.isOpen ? 'open' : 'closed'}</div>
  },
}))

jest.mock('@/components/old_dashboard/etta-panel', () => ({
  __esModule: true,
  default: () => <div data-testid='etta-panel' />,
}))

jest.mock('~/components/etta/EttaChat', () => ({
  EttaChat: (props: Record<string, unknown>) => {
    mockEttaChat(props)
    return <div data-testid='etta-chat' />
  },
}))

jest.mock('~/trpc/react', () => ({
  api: {
    etta: {
      getPendingCounts: {
        useQuery: (...args: unknown[]) => mockUsePendingCountsQuery(...args),
      },
    },
  },
}))

describe('AuthenticatedAppShell', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePendingCountsQuery.mockReturnValue({
      data: {
        guests: 1,
        events: 2,
        rsvp: 0,
        vendors: 3,
        budget: 0,
        tasks: 0,
        other: 4,
      },
    })
  })

  it('passes Etta availability into the chat panel', () => {
    render(
      <AuthenticatedAppShell showEttaPanel weddingId='wedding-1' isEttaConfigured={false}>
        <div>Content</div>
      </AuthenticatedAppShell>
    )

    expect(screen.getAllByTestId('etta-chat')).toHaveLength(2)
    expect(mockEttaChat).toHaveBeenCalledWith(
      expect.objectContaining({
        weddingId: 'wedding-1',
        persona: 'planner',
        isConfigured: false,
      })
    )
  })

  it('fetches pending suggestion counts once and passes them into the sidebar', () => {
    render(
      <AuthenticatedAppShell showEttaPanel weddingId='wedding-1' isEttaConfigured={false}>
        <div>Content</div>
      </AuthenticatedAppShell>
    )

    expect(mockUsePendingCountsQuery).toHaveBeenCalledWith(undefined, {
      staleTime: 30_000,
    })
    expect(mockSidebarNavFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        pendingSuggestionCounts: {
          guests: 1,
          events: 2,
          rsvp: 0,
          vendors: 3,
          budget: 0,
          tasks: 0,
          other: 4,
        },
      })
    )
  })
})
