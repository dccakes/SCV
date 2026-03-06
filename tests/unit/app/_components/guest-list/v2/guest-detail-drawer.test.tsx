import { fireEvent, render, screen } from '@testing-library/react'

import {
  GuestDetailDrawer,
  type GuestDetailDrawerProps,
} from '~/app/_components/guest-list/v2/drawer/guest-detail-drawer'

const renderDrawer = (props: Partial<GuestDetailDrawerProps> = {}) => {
  const onOpenChange = jest.fn()

  const view = render(
    <GuestDetailDrawer open={false} onOpenChange={onOpenChange} title='Guest details' {...props}>
      <p>Guest content</p>
    </GuestDetailDrawer>
  )

  return { ...view, onOpenChange }
}

describe('GuestDetailDrawer', () => {
  it('should render drawer content only when open', () => {
    const { rerender } = renderDrawer({ open: false })

    expect(screen.queryByText('Guest content')).not.toBeInTheDocument()

    rerender(
      <GuestDetailDrawer open onOpenChange={jest.fn()} title='Guest details'>
        <p>Guest content</p>
      </GuestDetailDrawer>
    )

    expect(screen.getByText('Guest content')).toBeInTheDocument()
  })

  it('should support desktop side panel styling', () => {
    renderDrawer({ open: true, mode: 'desktop' })

    const dialog = screen.getByRole('dialog', { name: 'Guest details' })

    expect(dialog).toHaveClass('md:inset-y-0')
    expect(dialog).toHaveClass('md:right-0')
    expect(dialog).toHaveClass('md:h-full')
    expect(dialog).toHaveClass('md:w-[520px]')
    expect(dialog).toHaveClass('md:translate-x-0')
    expect(dialog).toHaveClass('md:translate-y-0')
  })

  it('should support mobile full-screen styling', () => {
    renderDrawer({ open: true, mode: 'mobile' })

    const dialog = screen.getByRole('dialog', { name: 'Guest details' })

    expect(dialog).toHaveClass('inset-0')
    expect(dialog).toHaveClass('h-screen')
    expect(dialog).toHaveClass('w-screen')
    expect(dialog).toHaveClass('max-w-none')
    expect(dialog).toHaveClass('translate-x-0')
    expect(dialog).toHaveClass('translate-y-0')
  })

  it('should render a top-right close button with aria-label', () => {
    renderDrawer({ open: true })

    const closeButton = screen.getByRole('button', { name: 'Close guest details' })

    expect(closeButton).toBeInTheDocument()
    expect(closeButton).toHaveClass('absolute')
    expect(closeButton).toHaveClass('top-4')
    expect(closeButton).toHaveClass('right-4')
  })

  it('should call onOpenChange when close button is clicked', () => {
    const { onOpenChange } = renderDrawer({ open: true })

    fireEvent.click(screen.getByRole('button', { name: 'Close guest details' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
