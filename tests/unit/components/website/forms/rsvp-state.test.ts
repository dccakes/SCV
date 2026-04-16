import {
  type AnswerWithType,
  findExistingAnswer,
  removeAnswer,
  upsertAnswer,
  upsertRsvpResponses,
} from '~/components/website/forms/rsvp-state'

describe('rsvp-state utilities', () => {
  it('upserts RSVP responses by event+guest pair without duplicates', () => {
    const existing = [
      { eventId: 'evt-1', guestId: 1, rsvp: 'Attending', guestName: 'A One' },
      { eventId: 'evt-1', guestId: 2, rsvp: 'Declined', guestName: 'B Two' },
    ]

    const incoming = [
      { eventId: 'evt-1', guestId: 2, rsvp: 'Attending', guestName: 'B Two' },
      { eventId: 'evt-2', guestId: 1, rsvp: 'Attending', guestName: 'A One' },
    ]

    expect(upsertRsvpResponses(existing, incoming)).toEqual([
      { eventId: 'evt-1', guestId: 1, rsvp: 'Attending', guestName: 'A One' },
      { eventId: 'evt-1', guestId: 2, rsvp: 'Attending', guestName: 'B Two' },
      { eventId: 'evt-2', guestId: 1, rsvp: 'Attending', guestName: 'A One' },
    ])
  })

  it('upserts and removes question answers by question+audience key', () => {
    const answer: AnswerWithType = {
      questionId: 'q-1',
      questionType: 'Text',
      response: 'No nuts',
      guestId: 10,
      householdId: 'house-1',
      guestFirstName: 'Jamie',
      guestLastName: 'Doe',
    }

    const inserted = upsertAnswer([], answer)
    expect(inserted).toEqual([answer])
    expect(findExistingAnswer(inserted, answer)).toEqual(answer)

    const updated = upsertAnswer(inserted, { ...answer, response: 'Vegetarian' })
    expect(updated).toEqual([{ ...answer, response: 'Vegetarian' }])

    const removed = removeAnswer(updated, answer)
    expect(removed).toEqual([])
  })
})
