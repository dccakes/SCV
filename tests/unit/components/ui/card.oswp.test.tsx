import { render } from '@testing-library/react'

import { Card } from '~/components/ui/card'

describe('Card OSWP primitive contract', () => {
  it('uses OSWP card radius', () => {
    const { container } = render(<Card>Body</Card>)

    const card = container.firstElementChild
    expect(card).not.toBeNull()
    expect(card?.className).toContain('rounded-[8px]')
  })
})
