import { render, screen } from '@testing-library/react'

import { Button } from '~/components/ui/button'

describe('Button OSWP primitive contract', () => {
  it('uses OSWP geometry and typography by default', () => {
    render(<Button type='button'>Save</Button>)

    const button = screen.getByRole('button', { name: 'Save' })

    expect(button.className).toContain('rounded-[2px]')
    expect(button.className).toContain('font-mono')
    expect(button.className).toContain('uppercase')
    expect(button.className).toContain('tracking-[0.08em]')
  })
})
