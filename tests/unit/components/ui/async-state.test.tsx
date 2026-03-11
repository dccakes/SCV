import { render, screen } from '@testing-library/react'

import { AsyncState } from '~/components/ui/async-state'

describe('AsyncState', () => {
  it('renders loading with polite live region', () => {
    render(<AsyncState isLoading loadingText='Loading invite link...' />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading invite link...')
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  it('renders error with assertive alert semantics', () => {
    render(<AsyncState error='Unable to load invite link.' />)

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load invite link.')
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive')
  })

  it('renders empty state messaging', () => {
    render(<AsyncState isEmpty emptyText='No invite links yet.' />)

    expect(screen.getByRole('status')).toHaveTextContent('No invite links yet.')
  })

  it('renders nothing when no state is active', () => {
    const { container } = render(<AsyncState />)

    expect(container).toBeEmptyDOMElement()
  })
})
