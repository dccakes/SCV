import { fireEvent, render, screen } from '@testing-library/react'

import EttaPanel from '~/app/_components/dashboard/etta-panel'

describe('EttaPanel', () => {
  it('renders the Etta heading', () => {
    render(<EttaPanel />)
    expect(screen.getByText('Etta')).toBeInTheDocument()
  })

  it('renders the AI Planner subtitle', () => {
    render(<EttaPanel />)
    expect(screen.getByText(/OSWP AI Planner/i)).toBeInTheDocument()
  })

  it('renders the online status indicator', () => {
    render(<EttaPanel />)
    expect(screen.getByText(/online/i)).toBeInTheDocument()
  })

  it('renders the proactive nudge section', () => {
    render(<EttaPanel />)
    expect(screen.getByText(/etta noticed/i)).toBeInTheDocument()
  })

  it('dismisses nudge when "Yes, help me" is clicked', () => {
    render(<EttaPanel />)
    const yesBtn = screen.getByRole('button', { name: /yes, help me/i })
    fireEvent.click(yesBtn)
    expect(screen.queryByText(/etta noticed/i)).not.toBeInTheDocument()
  })

  it('dismisses nudge when "Remind me later" is clicked', () => {
    render(<EttaPanel />)
    const laterBtn = screen.getByRole('button', { name: /remind me later/i })
    fireEvent.click(laterBtn)
    expect(screen.queryByText(/etta noticed/i)).not.toBeInTheDocument()
  })

  it('renders at least 3 buttons (quick actions + suggestions + send)', () => {
    render(<EttaPanel />)
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(3)
  })

  it('renders the message input with correct placeholder', () => {
    render(<EttaPanel />)
    expect(screen.getByPlaceholderText(/ask etta/i)).toBeInTheDocument()
  })

  it('populates the input when a suggestion chip is clicked', () => {
    render(<EttaPanel />)
    const chips = screen.getAllByRole('button')
    const budgetChip = chips.find((b) => b.textContent?.toLowerCase().includes('budget risk'))
    expect(budgetChip).toBeDefined()
    fireEvent.click(budgetChip!)
    const input = screen.getByPlaceholderText(/ask etta/i) as HTMLInputElement
    expect(input.value).toMatch(/budget/i)
  })

  it('clears input and adds message when send button is clicked with text', () => {
    render(<EttaPanel />)
    const input = screen.getByPlaceholderText(/ask etta/i)
    fireEvent.change(input, { target: { value: 'Hello Etta' } })
    const sendBtn = screen.getByRole('button', { name: /send/i })
    fireEvent.click(sendBtn)
    expect((input as HTMLInputElement).value).toBe('')
    // User message should appear in the thread
    expect(screen.getByText('Hello Etta')).toBeInTheDocument()
  })

  it('sends message and clears input when Enter key is pressed', () => {
    render(<EttaPanel />)
    const input = screen.getByPlaceholderText(/ask etta/i)
    fireEvent.change(input, { target: { value: 'Enter key test' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    expect((input as HTMLInputElement).value).toBe('')
    expect(screen.getByText('Enter key test')).toBeInTheDocument()
  })

  it('does not send empty message when send button is clicked', () => {
    render(<EttaPanel />)
    const initialMessageCount = screen.getAllByText(/Etta · |You ·/).length
    const sendBtn = screen.getByRole('button', { name: /send/i })
    fireEvent.click(sendBtn)
    // No new messages should be added
    expect(screen.getAllByText(/Etta · |You ·/).length).toBe(initialMessageCount)
  })

  it('shows Etta reply after user sends a message', () => {
    render(<EttaPanel />)
    const input = screen.getByPlaceholderText(/ask etta/i)
    fireEvent.change(input, { target: { value: 'Any reply?' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
  })

  it('uses muted metadata styling for message timestamps', () => {
    render(<EttaPanel />)
    expect(screen.getByText(/Etta ·/)).toHaveClass('text-sidebar-cream/22')
  })
})
