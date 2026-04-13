import { fireEvent, render, screen } from '@testing-library/react'

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
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders a shared mobile sidebar trigger', () => {
    render(
      <AuthenticatedAppShell>
        <div>Content</div>
      </AuthenticatedAppShell>
    )

    expect(screen.getByRole('button', { name: /open sidebar/i })).toBeInTheDocument()
  })

  it('opens sidebar when shared trigger is clicked', () => {
    render(
      <AuthenticatedAppShell>
        <div>Content</div>
      </AuthenticatedAppShell>
    )

    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('closed')
    fireEvent.click(screen.getByRole('button', { name: /open sidebar/i }))
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('open')
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
