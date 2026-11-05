import { RSVP_STATUS } from '~/lib/constants/rsvp'
import { toCsv } from '~/lib/csv'

/**
 * Guest list exports for couples to hand to caterers, planners and venues.
 *
 * Dietary needs are not a dedicated field in practice: couples collect them
 * through their own RSVP questions, so every question becomes a column.
 */

export type GuestExportEvent = { id: string; name: string }

export type GuestExportQuestion = {
  id: string
  text: string
  /** null for general (website level) questions */
  eventId: string | null
}

export type GuestExportHousehold = {
  id: string
  address1: string | null
  address2: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
}

export type GuestExportGuest = {
  id: number
  householdId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  ageGroup: 'INFANT' | 'CHILD' | 'TEEN' | 'ADULT' | null
  isTagAlong: boolean
  isPrimaryContact: boolean
  tags: string[]
}

export type GuestExportInvitation = { guestId: number; eventId: string; rsvp: string }

/**
 * One saved answer. Option answers are already resolved to the chosen
 * option's text. Event questions are answered per guest. General questions are
 * answered once per household and saved against one member (usually the
 * primary contact), so the export treats them as the household's answer.
 */
export type GuestExportAnswer = {
  questionId: string
  guestId: number
  householdId: string
  response: string
}

export type GuestExportData = {
  /** In display order */
  events: GuestExportEvent[]
  /** In display order */
  questions: GuestExportQuestion[]
  households: GuestExportHousehold[]
  guests: GuestExportGuest[]
  invitations: GuestExportInvitation[]
  answers: GuestExportAnswer[]
}

/** Marks general question columns, whose answer is shared by the whole party */
const HOUSEHOLD_SUFFIX = ' (household)'

const isGeneral = (question: GuestExportQuestion): boolean => question.eventId === null

const AGE_GROUP_LABELS: Record<NonNullable<GuestExportGuest['ageGroup']>, string> = {
  INFANT: 'Infant',
  CHILD: 'Child',
  TEEN: 'Teen',
  ADULT: 'Adult',
}

const RSVP_LABELS: Record<string, string> = {
  [RSVP_STATUS.ATTENDING]: 'Attending',
  [RSVP_STATUS.DECLINED]: 'Declined',
  [RSVP_STATUS.INVITED]: 'No response',
  [RSVP_STATUS.NOT_INVITED]: 'Not invited',
}

const rsvpLabel = (rsvp: string | undefined): string =>
  rsvp === undefined ? 'Not invited' : (RSVP_LABELS[rsvp] ?? rsvp)

const yesNo = (value: boolean): string => (value ? 'Yes' : 'No')

const fullName = (guest: { firstName: string; lastName: string }): string =>
  `${guest.firstName} ${guest.lastName}`.trim()

const compareGuests = (a: GuestExportGuest, b: GuestExportGuest): number =>
  a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName) || a.id - b.id

/**
 * Lookups shared by both layouts: who names each household, each guest's RSVP
 * per event, and each guest's answer per question.
 */
const buildIndex = (data: GuestExportData) => {
  const guestsByHousehold = new Map<string, GuestExportGuest[]>()
  for (const guest of data.guests) {
    const members = guestsByHousehold.get(guest.householdId) ?? []
    members.push(guest)
    guestsByHousehold.set(guest.householdId, members)
  }

  // A household is named after its primary contact, or its first member by name
  const householdLabel = new Map<string, string>()
  for (const [householdId, members] of guestsByHousehold) {
    const named =
      members.find((guest) => guest.isPrimaryContact) ?? [...members].sort(compareGuests)[0]
    householdLabel.set(householdId, named ? fullName(named) : '')
  }

  const rsvpByGuestEvent = new Map<string, string>()
  for (const invitation of data.invitations) {
    rsvpByGuestEvent.set(`${invitation.guestId}:${invitation.eventId}`, invitation.rsvp)
  }

  const generalQuestionIds = new Set(data.questions.filter(isGeneral).map((q) => q.id))
  const answerByKey = new Map<string, string>()
  for (const answer of data.answers) {
    const owner = generalQuestionIds.has(answer.questionId)
      ? `h:${answer.householdId}`
      : `g:${answer.guestId}`
    answerByKey.set(`${answer.questionId}:${owner}`, answer.response)
  }

  const householdById = new Map(data.households.map((household) => [household.id, household]))

  return {
    householdLabel: (guest: GuestExportGuest) => householdLabel.get(guest.householdId) ?? '',
    household: (guest: GuestExportGuest) => householdById.get(guest.householdId),
    rsvp: (guest: GuestExportGuest, eventId: string) =>
      rsvpByGuestEvent.get(`${guest.id}:${eventId}`),
    // General answers repeat on every member of the household
    answer: (guest: GuestExportGuest, question: GuestExportQuestion) =>
      answerByKey.get(
        isGeneral(question)
          ? `${question.id}:h:${guest.householdId}`
          : `${question.id}:g:${guest.id}`
      ) ?? '',
  }
}

type Index = ReturnType<typeof buildIndex>

/** Keep households together, primary contact first, then members by name. */
const sortRows = (guests: readonly GuestExportGuest[], index: Index): GuestExportGuest[] =>
  [...guests].sort(
    (a, b) =>
      index.householdLabel(a).localeCompare(index.householdLabel(b)) ||
      a.householdId.localeCompare(b.householdId) ||
      Number(b.isPrimaryContact) - Number(a.isPrimaryContact) ||
      compareGuests(a, b)
  )

const ageGroupLabel = (guest: GuestExportGuest): string =>
  guest.ageGroup ? AGE_GROUP_LABELS[guest.ageGroup] : ''

/**
 * Whole wedding: one row per guest with contact details, mailing address, an
 * RSVP column per event and a column per RSVP question.
 */
export const buildGuestListCsv = (data: GuestExportData): string => {
  const index = buildIndex(data)
  const eventNameById = new Map(data.events.map((event) => [event.id, event.name]))
  const questionHeader = (question: GuestExportQuestion): string => {
    const eventName = question.eventId ? eventNameById.get(question.eventId) : undefined
    return eventName ? `${eventName}: ${question.text}` : `${question.text}${HOUSEHOLD_SUFFIX}`
  }

  const header = [
    'First Name',
    'Last Name',
    'Household',
    'Primary Contact',
    'Age Group',
    'Tag-along',
    'Tags',
    'Email',
    'Phone',
    'Address Line 1',
    'Address Line 2',
    'City',
    'State',
    'Zip Code',
    'Country',
    ...data.events.map((event) => `RSVP: ${event.name}`),
    ...data.questions.map(questionHeader),
  ]

  const rows = sortRows(data.guests, index).map((guest) => {
    const household = index.household(guest)
    return [
      guest.firstName,
      guest.lastName,
      index.householdLabel(guest),
      yesNo(guest.isPrimaryContact),
      ageGroupLabel(guest),
      yesNo(guest.isTagAlong),
      [...guest.tags].sort((a, b) => a.localeCompare(b)).join('; '),
      guest.email ?? '',
      guest.phone ?? '',
      household?.address1 ?? '',
      household?.address2 ?? '',
      household?.city ?? '',
      household?.state ?? '',
      household?.zipCode ?? '',
      household?.country ?? '',
      ...data.events.map((event) => rsvpLabel(index.rsvp(guest, event.id))),
      ...data.questions.map((question) => index.answer(guest, question)),
    ]
  })

  return toCsv([header, ...rows])
}

/**
 * One event, for handing to a caterer or venue: only guests invited to that
 * event, their RSVP, and the answers to that event's questions plus the
 * general questions. Contact details and addresses are left out on purpose
 * because this file is meant to leave the couple's hands.
 */
export const buildEventGuestCsv = (data: GuestExportData, eventId: string): string => {
  const index = buildIndex(data)
  const questions = data.questions.filter(
    (question) => question.eventId === eventId || question.eventId === null
  )
  // Event questions first, then general ones, each keeping display order
  const orderedQuestions = [
    ...questions.filter((question) => question.eventId !== null),
    ...questions.filter((question) => question.eventId === null),
  ]

  const header = [
    'First Name',
    'Last Name',
    'Household',
    'Age Group',
    'Tag-along',
    'RSVP',
    ...orderedQuestions.map((question) =>
      isGeneral(question) ? `${question.text}${HOUSEHOLD_SUFFIX}` : question.text
    ),
  ]

  const invited = data.guests.filter((guest) => {
    const rsvp = index.rsvp(guest, eventId)
    return rsvp !== undefined && rsvp !== RSVP_STATUS.NOT_INVITED
  })

  const rows = sortRows(invited, index).map((guest) => [
    guest.firstName,
    guest.lastName,
    index.householdLabel(guest),
    ageGroupLabel(guest),
    yesNo(guest.isTagAlong),
    rsvpLabel(index.rsvp(guest, eventId)),
    ...orderedQuestions.map((question) => index.answer(guest, question)),
  ])

  return toCsv([header, ...rows])
}
