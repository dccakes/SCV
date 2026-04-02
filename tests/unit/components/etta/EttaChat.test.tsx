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
})
