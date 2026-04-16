import { fireEvent, render, screen } from '@testing-library/react'

import QuestionMultipleChoice from '~/components/website/forms/steps/question-multiple-choice'

const mockUpdateRsvpForm = jest.fn()
let mockRsvpFormData: {
  selectedHousehold: {
    id: string
    primaryContact: { firstName: string; lastName: string }
  }
  answersToQuestions: Array<{
    questionId: string
    questionType: 'Text' | 'Option'
    response: string
    guestId?: number
    householdId?: string
  }>
  rsvpResponses: unknown[]
}

jest.mock('~/components/contexts/rsvp-form-context', () => ({
  useRsvpForm: () => mockRsvpFormData,
  useUpdateRsvpForm: () => mockUpdateRsvpForm,
}))

describe('QuestionMultipleChoice', () => {
  beforeEach(() => {
    mockUpdateRsvpForm.mockReset()
    mockRsvpFormData = {
      selectedHousehold: {
        id: 'house-1',
        primaryContact: { firstName: 'Shrek', lastName: 'Ogre' },
      },
      answersToQuestions: [],
      rsvpResponses: [],
    }
  })

  it('does not render Other option by default', () => {
    render(
      <QuestionMultipleChoice
        question={{
          id: 'q-1',
          text: 'Meal preference?',
          type: 'Option',
          isRequired: true,
          allowOther: false,
          options: [
            { id: 'o-1', questionId: 'q-1', text: 'Chicken', description: '', responseCount: 0 },
            { id: 'o-2', questionId: 'q-1', text: 'Fish', description: '', responseCount: 0 },
          ],
        }}
      />
    )

    expect(screen.queryByRole('button', { name: /other/i })).not.toBeInTheDocument()
  })

  it('stores a text answer when Other is enabled and selected', () => {
    const goNext = jest.fn()

    render(
      <QuestionMultipleChoice
        goNext={goNext}
        question={{
          id: 'q-1',
          text: 'Meal preference?',
          type: 'Option',
          isRequired: true,
          allowOther: true,
          options: [
            { id: 'o-1', questionId: 'q-1', text: 'Chicken', description: '', responseCount: 0 },
            { id: 'o-2', questionId: 'q-1', text: 'Fish', description: '', responseCount: 0 },
          ],
        }}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /other/i }))
    fireEvent.change(screen.getByPlaceholderText(/please share your answer/i), {
      target: { value: 'Pasta' },
    })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(mockUpdateRsvpForm).toHaveBeenCalledWith({
      answersToQuestions: [
        {
          questionId: 'q-1',
          questionType: 'Text',
          response: 'Pasta',
          guestId: undefined,
          householdId: 'house-1',
          guestFirstName: 'Shrek',
          guestLastName: 'Ogre',
        },
      ],
    })
    expect(goNext).toHaveBeenCalled()
  })
})
