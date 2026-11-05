import { render, screen } from '@testing-library/react'

const mockUseChat = jest.fn()

jest.mock('@ai-sdk/react', () => ({
  useChat: (...args: unknown[]) => mockUseChat(...args),
}))

describe('EttaChat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: jest.fn(),
      status: 'ready',
    })
  })

  it('shows offline status when Etta is not configured', async () => {
    const { EttaChat } = await import('~/components/etta/EttaChat')

    render(<EttaChat weddingId='wedding-1' persona='planner' isConfigured={false} />)

    expect(screen.getByText('offline')).toBeInTheDocument()
  })

  it('tells the user to slow down when the request was rate limited', async () => {
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: jest.fn(),
      status: 'error',
      error: new Error('{"error":"Too many requests. Please try again later."}'),
    })
    const { EttaChat } = await import('~/components/etta/EttaChat')

    render(<EttaChat weddingId='wedding-1' persona='planner' />)

    expect(screen.getByRole('alert')).toHaveTextContent(/sending messages quickly/i)
  })

  it('shows a plain retry message for any other failure instead of staying silent', async () => {
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: jest.fn(),
      status: 'error',
      error: new Error('Internal server error'),
    })
    const { EttaChat } = await import('~/components/etta/EttaChat')

    render(<EttaChat weddingId='wedding-1' persona='planner' />)

    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't respond just now/i)
  })

  it('shows no error banner while the chat is healthy', async () => {
    const { EttaChat } = await import('~/components/etta/EttaChat')

    render(<EttaChat weddingId='wedding-1' persona='planner' />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
