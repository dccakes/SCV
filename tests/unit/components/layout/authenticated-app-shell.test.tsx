import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'

import AuthenticatedAppShell from '~/components/layout/authenticated-app-shell'

const mockEttaChat = jest.fn(() => <div data-testid='etta-chat' />)

jest.mock('~/components/nav/sidebar-nav', () => ({
  __esModule: true,
  default: ({ isOpen, onToggleEttaPanel }: { isOpen: boolean; onToggleEttaPanel?: () => void }) => (
    <div>
      <div data-testid='sidebar-state'>{isOpen ? 'open' : 'closed'}</div>
      <button type='button' onClick={onToggleEttaPanel}>
        Toggle Etta
      </button>
    </div>
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

  it('never includes the full-screen overlay in the first (server) render', () => {
    emulateScreen(true)
    localStorage.setItem('etta-panel-open', 'true')

    const html = renderToString(
      <AuthenticatedAppShell showEttaPanel weddingId='wedding-1' isEttaConfigured>
        <div>Content</div>
      </AuthenticatedAppShell>
    )

    expect(html).not.toContain('role="dialog"')
  })

  it('does not save the setting when Etta is opened and closed on a small screen', async () => {
    emulateScreen(true)
    localStorage.setItem('etta-panel-open', 'true')
    const setItem = jest.spyOn(Storage.prototype, 'setItem')

    renderShell()
    const toggle = screen.getByRole('button', { name: 'Toggle Etta' })
    fireEvent.click(toggle)
    await screen.findByRole('dialog', { name: 'Etta AI assistant' })
    fireEvent.click(toggle)

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Etta AI assistant' })).not.toBeInTheDocument()
    )
    expect(setItem).not.toHaveBeenCalled()
    setItem.mockRestore()
  })

  it('does not remember opening or closing Etta on a small screen', async () => {
    emulateScreen(true)
    localStorage.setItem('etta-panel-open', 'false')

    renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Etta' }))

    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: 'Etta AI assistant' })).toBeInTheDocument()
    )
    expect(localStorage.getItem('etta-panel-open')).toBe('false')
  })

  it('remembers closing Etta on a large screen', async () => {
    emulateScreen(false)

    renderShell()
    await waitFor(() => expect(screen.getAllByTestId('etta-chat')).toHaveLength(2))
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Etta' }))

    await waitFor(() => expect(screen.queryByTestId('etta-chat')).not.toBeInTheDocument())
    expect(localStorage.getItem('etta-panel-open')).toBe('false')
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
