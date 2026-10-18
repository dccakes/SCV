import { render, screen } from '@testing-library/react'

import { Button } from '~/components/ui/button'

describe('Button OSWP primitive contract', () => {
  it('uses Evergreen geometry and sentence-case typography by default', () => {
    render(<Button type='button'>Save</Button>)

    const button = screen.getByRole('button', { name: 'Save' })

    expect(button).toHaveClass('rounded-[10px]', 'font-sans', 'font-semibold', 'text-sm')
    expect(button).not.toHaveClass('uppercase')
  })

  it('carries the ui-button hook so guest surfaces can restore the original shape', () => {
    render(<Button type='button'>Save</Button>)

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('ui-button')
  })
})
