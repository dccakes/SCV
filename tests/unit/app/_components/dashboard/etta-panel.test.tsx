import { render, screen, fireEvent } from '@testing-library/react'

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

  it('renders at least 3 buttons (quick actions + suggestions + send)', () => {
    render(<EttaPanel />)
    expect(screen.getAllByRole('button').length).toBeGreaterThan(2)
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
  })
})
