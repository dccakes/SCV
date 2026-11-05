import { fireEvent, render, screen } from '@testing-library/react'

import { WorkspaceCapabilitiesProvider } from '~/components/contexts/workspace-capabilities-context'
import NoGuestsView from '~/components/guest-list/no-guests-view'

const mockToggleGuestForm = jest.fn()

jest.mock('~/components/contexts/guest-form-context', () => ({
  useToggleGuestForm: () => mockToggleGuestForm,
}))

describe('NoGuestsView', () => {
  it('wires Import from CSV and Add your first guest controls with non-submit button semantics', () => {
    const onImportClick = jest.fn()
    const setPrefillHousehold = jest.fn()

    render(<NoGuestsView onImportClick={onImportClick} setPrefillHousehold={setPrefillHousehold} />)

    const importButton = screen.getByRole('button', { name: 'Import from CSV' })
    const addButton = screen.getByRole('button', { name: 'Add your first guest' })

    fireEvent.click(importButton)
    fireEvent.click(addButton)

    expect(importButton).toHaveAttribute('type', 'button')
    expect(addButton).toHaveAttribute('type', 'button')
    expect(onImportClick).toHaveBeenCalledTimes(1)
    expect(setPrefillHousehold).toHaveBeenCalledWith(undefined)
    expect(mockToggleGuestForm).toHaveBeenCalledTimes(1)
  })

  it('hides add and import controls for viewers', () => {
    render(
      <WorkspaceCapabilitiesProvider canEditPlanning={false}>
        <NoGuestsView onImportClick={jest.fn()} setPrefillHousehold={jest.fn()} />
      </WorkspaceCapabilitiesProvider>
    )

    expect(screen.getByText('No guests yet')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Import from CSV' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add your first guest' })).not.toBeInTheDocument()
  })
})
