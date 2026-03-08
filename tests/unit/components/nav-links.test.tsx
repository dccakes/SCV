import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'

import NavLinks from '~/components/nav-links'

const mockUsePathname = usePathname as jest.Mock

describe('NavLinks', () => {
  it('should show vendors in the top navigation', () => {
    mockUsePathname.mockReturnValue('/dashboard')

    render(<NavLinks />)

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Guest List' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Events' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Vendors' })).toBeInTheDocument()
  })

  it('should mark vendors as active on vendors pages', () => {
    mockUsePathname.mockReturnValue('/vendors')

    render(<NavLinks />)

    const vendorsLink = screen.getByRole('link', { name: 'Vendors' })
    expect(vendorsLink).toHaveClass('border-primary')
  })
})
