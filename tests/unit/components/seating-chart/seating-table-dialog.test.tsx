import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { SeatingTableDialog } from '~/components/seating-chart/seating-table-dialog'

const renderDialog = (overrides: Partial<Parameters<typeof SeatingTableDialog>[0]> = {}) => {
  const onSubmit = jest.fn()
  render(
    <SeatingTableDialog
      mode='create'
      open
      defaultValues={{ name: 'Table 1', shape: 'ROUND', capacity: 8 }}
      isSubmitting={false}
      onOpenChange={jest.fn()}
      onSubmit={onSubmit}
      {...overrides}
    />
  )
  return { onSubmit }
}

describe('SeatingTableDialog', () => {
  it('submits name, shape and seat count', async () => {
    const { onSubmit } = renderDialog()

    fireEvent.change(screen.getByLabelText('Table name'), { target: { value: 'Head Table' } })
    fireEvent.click(screen.getByLabelText('Rectangular'))
    fireEvent.change(screen.getByLabelText('Seats'), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add table' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Head Table',
        shape: 'RECTANGULAR',
        capacity: 12,
      })
    )
  })

  it('requires a table name', async () => {
    const { onSubmit } = renderDialog()

    fireEvent.change(screen.getByLabelText('Table name'), { target: { value: '  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add table' }))

    expect(await screen.findByText('Table name is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('blocks reducing seats below the guests already seated', async () => {
    const { onSubmit } = renderDialog({ mode: 'edit', minCapacity: 6 })

    fireEvent.change(screen.getByLabelText('Seats'), { target: { value: '4' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText(/6 guests are seated here/)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('offers delete only when editing', () => {
    const onDelete = jest.fn()
    renderDialog({ mode: 'edit', onDelete })

    fireEvent.click(screen.getByRole('button', { name: 'Delete table' }))
    expect(onDelete).toHaveBeenCalled()
  })

  it('keeps what the user typed when table data changes while open', () => {
    const props = {
      mode: 'edit' as const,
      isSubmitting: false,
      onOpenChange: jest.fn(),
      onSubmit: jest.fn(),
    }
    const { rerender } = render(
      <SeatingTableDialog
        {...props}
        open
        defaultValues={{ name: 'Table 1', shape: 'ROUND', capacity: 8 }}
      />
    )
    fireEvent.change(screen.getByLabelText('Table name'), { target: { value: 'Draft name' } })

    // e.g. an optimistic update followed by a rollback after a failed save
    rerender(
      <SeatingTableDialog
        {...props}
        open
        defaultValues={{ name: 'Table 1', shape: 'ROUND', capacity: 8 }}
      />
    )

    expect(screen.getByLabelText('Table name')).toHaveValue('Draft name')
  })

  it('loads fresh values each time it opens', () => {
    const props = {
      mode: 'edit' as const,
      isSubmitting: false,
      onOpenChange: jest.fn(),
      onSubmit: jest.fn(),
    }
    const { rerender } = render(
      <SeatingTableDialog
        {...props}
        open={false}
        defaultValues={{ name: 'Old', shape: 'ROUND', capacity: 8 }}
      />
    )
    rerender(
      <SeatingTableDialog
        {...props}
        open
        defaultValues={{ name: 'Head Table', shape: 'RECTANGULAR', capacity: 10 }}
      />
    )

    expect(screen.getByLabelText('Table name')).toHaveValue('Head Table')
    expect(screen.getByLabelText('Seats')).toHaveValue(10)
  })
})
