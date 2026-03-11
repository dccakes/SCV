import { render, screen } from '@testing-library/react'

import { Input } from '~/components/ui/input'

describe('Input OSWP primitive contract', () => {
  it('uses OSWP field geometry and type styles', () => {
    render(<Input aria-label='Email' />)

    const input = screen.getByRole('textbox', { name: 'Email' })

    expect(input.className).toContain('rounded-[4px]')
    expect(input.className).toContain('font-sans')
    expect(input.className).toContain('text-sm')
    expect(input.className).not.toContain('text-base')
  })
})
