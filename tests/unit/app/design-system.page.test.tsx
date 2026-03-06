import { render, screen } from '@testing-library/react'

import DesignSystemPage from '~/app/design-system/page'

describe('DesignSystemPage', () => {
  it('should render all color theme previews for quick comparison', () => {
    render(<DesignSystemPage />)

    expect(screen.getByRole('heading', { name: 'Design System' })).toBeInTheDocument()
    expect(screen.getByText(/Enable background graphics/i)).toBeInTheDocument()
    expect(screen.getByTestId('theme-default-light')).toBeInTheDocument()
    expect(screen.getByTestId('theme-default-dark')).toBeInTheDocument()
    expect(screen.queryByTestId('theme-landing-light')).not.toBeInTheDocument()
    expect(screen.queryByTestId('theme-dashboard-light')).not.toBeInTheDocument()
  })

  it('should show core color tokens in each theme card', () => {
    render(<DesignSystemPage />)

    expect(screen.getAllByText('--background').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('--foreground').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('--primary').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('--accent').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText(/Hex:/).length).toBeGreaterThan(0)
  })

  it('should include text color tokens like sidebar cream and ink', () => {
    render(<DesignSystemPage />)

    expect(screen.getAllByText('--sidebar-cream').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('--sidebar-ink').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('--etta-ink').length).toBeGreaterThanOrEqual(2)
  })
})
