import { render, screen, waitFor } from '@testing-library/react'

import AuthenticatedAppShell from '~/components/layout/authenticated-app-shell'

const mockEttaChat = jest.fn(() => <div data-testid='etta-chat' />)

jest.mock('~/components/nav/sidebar-nav', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid='sidebar-state'>{isOpen ? 'open' : 'closed'}</div>
  ),
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

describe('AuthenticatedAppShell', () => {
  const originalMatchMedia = window.matchMedia

  const emulateScreen = (isSmall: boolean) => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 1023px)' ? isSmall : false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })) as unknown as typeof window.matchMedia
  }

  const renderShell = () =>
    render(
      <AuthenticatedAppShell showEttaPanel weddingId='wedding-1' isEttaConfigured>
        <div>Content</div>
      </AuthenticatedAppShell>
    )

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('starts Etta closed on small screens even when it was left open', async () => {
    emulateScreen(true)
    localStorage.setItem('etta-panel-open', 'true')

    renderShell()

    await waitFor(() => expect(screen.queryByTestId('etta-chat')).not.toBeInTheDocument())
    expect(screen.queryByRole('dialog', { name: 'Etta AI assistant' })).not.toBeInTheDocument()
    // The desktop preference is left alone
    expect(localStorage.getItem('etta-panel-open')).toBe('true')
  })

  it('keeps the saved open state on large screens', async () => {
    emulateScreen(false)
    localStorage.setItem('etta-panel-open', 'true')

    renderShell()

    await waitFor(() => expect(screen.getAllByTestId('etta-chat')).toHaveLength(2))
  })

  it('respects a saved closed state on large screens', async () => {
    emulateScreen(false)
    localStorage.setItem('etta-panel-open', 'false')

    renderShell()

    await waitFor(() => expect(screen.queryByTestId('etta-chat')).not.toBeInTheDocument())
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
})
