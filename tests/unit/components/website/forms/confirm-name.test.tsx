import { fireEvent, render, screen } from '@testing-library/react'

import ConfirmNameForm from '~/components/website/forms/steps/confirm-name'

const mockUpdateRsvpForm = jest.fn()
let mockFormState: {
  matchedHouseholds?: unknown[]
  selectedHousehold?: unknown
  recognized?: boolean
}

jest.mock('~/components/contexts/rsvp-form-context', () => ({
  useRsvpForm: () => mockFormState,
  useUpdateRsvpForm: () => mockUpdateRsvpForm,
}))

const household = (id: string, firstName: string) => ({
  id,
  guests: [
    {
      id: 1,
      firstName,
      lastName: 'Weasley',
      isPrimaryContact: true,
      isTagAlong: false,
      invitations: [],
      guestTagAssignments: [],
    },
  ],
})

describe('ConfirmNameForm', () => {
  beforeEach(() => {
    mockUpdateRsvpForm.mockReset()
    mockFormState = { matchedHouseholds: [], selectedHousehold: undefined }
  })

  it('pre-selects the household when there is exactly one match', () => {
    mockFormState = { matchedHouseholds: [household('h1', 'Ron')] }
    render(<ConfirmNameForm goNext={jest.fn()} goBack={jest.fn()} />)

    // A single match is auto-selected so CONTINUE is immediately actionable.
    expect(screen.getByRole('radio')).toBeChecked()
    expect(screen.getByRole('button', { name: 'CONTINUE' })).toBeEnabled()
  })

  it('does not pre-select when there are multiple matches', () => {
    mockFormState = {
      matchedHouseholds: [household('h1', 'Ron'), household('h2', 'Harry')],
    }
    render(<ConfirmNameForm goNext={jest.fn()} goBack={jest.fn()} />)

    const radios = screen.getAllByRole('radio')
    expect(radios.every((radio) => !(radio as HTMLInputElement).checked)).toBe(true)
    expect(screen.getByRole('button', { name: 'CONTINUE' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'SEARCH AGAIN' })).toBeInTheDocument()
  })

  it('offers a "Not you?" escape that clears the recognized match and goes back to search', () => {
    const goBack = jest.fn()
    mockFormState = { matchedHouseholds: [household('h1', 'Ron')], recognized: true }
    render(<ConfirmNameForm goNext={jest.fn()} goBack={goBack} />)

    fireEvent.click(screen.getByRole('button', { name: 'NOT YOU?' }))

    expect(mockUpdateRsvpForm).toHaveBeenCalledWith(
      expect.objectContaining({ recognized: false, matchedHouseholds: [] })
    )
    expect(goBack).toHaveBeenCalledTimes(1)
  })
})
