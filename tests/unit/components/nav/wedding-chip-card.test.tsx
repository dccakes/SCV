import { render, screen } from '@testing-library/react'

import WeddingChipCard from '~/components/nav/wedding-chip-card'

describe('WeddingChipCard', () => {
  it('should render provided couple details', () => {
    render(
      <WeddingChipCard
        coupleName='Holly & Diego'
        weddingDate='17 May 2027'
        weddingLocation='Oaxaca, Mexico'
      />
    )

    expect(screen.getByText('Holly & Diego')).toBeInTheDocument()
    expect(screen.getByText('17 May 2027')).toBeInTheDocument()
    expect(screen.getByText('Oaxaca, Mexico')).toBeInTheDocument()
    expect(screen.getByText('Holly & Diego')).toHaveClass('text-sidebar-cream')
    expect(screen.getByText('17 May 2027')).toHaveClass('text-accent')
    expect(screen.getByText('Oaxaca, Mexico')).toHaveClass('text-sidebar-cream/45')
  })

  it('should only render values that are present', () => {
    render(<WeddingChipCard weddingDate='17 May 2027' />)

    expect(screen.queryByText('Holly & Diego')).not.toBeInTheDocument()
    expect(screen.getByText('17 May 2027')).toBeInTheDocument()
    expect(screen.queryByText('Oaxaca, Mexico')).not.toBeInTheDocument()
  })
})
