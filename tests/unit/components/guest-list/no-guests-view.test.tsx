import { fireEvent, render, screen } from '@testing-library/react'

import NoGuestsView from '~/components/guest-list/no-guests-view'

const mockToggleGuestForm = jest.fn()

jest.mock('~/components/contexts/guest-form-context', () => ({
  useToggleGuestForm: () => mockToggleGuestForm,
}))

jest.mock('~/components/guest-list/example-table', () => ({
  __esModule: true,
  default: () => <div data-testid='example-table' />,
}))

describe('NoGuestsView', () => {
  it('wires Add Guest and Import Guests controls with non-submit button semantics', () => {
    const onImportClick = jest.fn()
    const setPrefillHousehold = jest.fn()

    render(<NoGuestsView onImportClick={onImportClick} setPrefillHousehold={setPrefillHousehold} />)

    const importButton = screen.getByRole('button', { name: 'Import Guests' })
    const addButton = screen.getByRole('button', { name: 'Add Guest' })

    fireEvent.click(importButton)
    fireEvent.click(addButton)

    expect(importButton).toHaveAttribute('type', 'button')
    expect(addButton).toHaveAttribute('type', 'button')
    expect(onImportClick).toHaveBeenCalledTimes(1)
    expect(setPrefillHousehold).toHaveBeenCalledWith(undefined)
    expect(mockToggleGuestForm).toHaveBeenCalledTimes(1)
  })
})
