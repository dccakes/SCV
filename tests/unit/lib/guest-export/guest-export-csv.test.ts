import {
  buildEventGuestCsv,
  buildGuestListCsv,
  type GuestExportData,
  type GuestExportGuest,
} from '~/lib/guest-export/guest-export-csv'

const guest = (overrides: Partial<GuestExportGuest> & Pick<GuestExportGuest, 'id'>) => ({
  householdId: 'h1',
  firstName: 'First',
  lastName: 'Last',
  email: null,
  phone: null,
  ageGroup: 'ADULT' as const,
  isTagAlong: false,
  isPrimaryContact: false,
  tags: [],
  ...overrides,
})

const household = (id: string, city: string | null = null) => ({
  id,
  address1: null,
  address2: null,
  city,
  state: null,
  zipCode: null,
  country: null,
})

const buildData = (): GuestExportData => ({
  events: [
    { id: 'ceremony', name: 'Ceremony' },
    { id: 'reception', name: 'Reception' },
  ],
  questions: [
    { id: 'meal', text: 'Meal choice', eventId: 'reception' },
    { id: 'song', text: 'Song request', eventId: 'ceremony' },
    { id: 'diet', text: 'Dietary needs', eventId: null },
  ],
  households: [household('h1', 'Puebla'), household('h2')],
  guests: [
    guest({ id: 2, householdId: 'h1', firstName: 'Ana', lastName: 'Ruiz' }),
    guest({
      id: 1,
      householdId: 'h1',
      firstName: 'José',
      lastName: 'Ruiz',
      email: 'jose@example.com',
      isPrimaryContact: true,
      tags: ['Family', 'Bride side'],
    }),
    guest({ id: 3, householdId: 'h1', firstName: 'Leo', lastName: 'Ruiz', ageGroup: 'CHILD' }),
    guest({
      id: 4,
      householdId: 'h2',
      firstName: 'Bea',
      lastName: 'Adams',
      isPrimaryContact: true,
    }),
  ],
  invitations: [
    { guestId: 1, eventId: 'ceremony', rsvp: 'Attending' },
    { guestId: 1, eventId: 'reception', rsvp: 'Attending' },
    { guestId: 2, eventId: 'ceremony', rsvp: 'Declined' },
    { guestId: 2, eventId: 'reception', rsvp: 'Invited' },
    { guestId: 3, eventId: 'reception', rsvp: 'Attending' },
    { guestId: 4, eventId: 'ceremony', rsvp: 'Attending' },
    { guestId: 4, eventId: 'reception', rsvp: 'Not Invited' },
  ],
  answers: [
    { questionId: 'meal', guestId: 1, householdId: 'h1', response: 'Fish' },
    { questionId: 'meal', guestId: 3, householdId: 'h1', response: 'Kids menu' },
    // General questions are answered once per household, saved on the primary contact
    { questionId: 'diet', guestId: 1, householdId: 'h1', response: 'Nut allergy' },
  ],
})

const parse = (csv: string) => csv.split('\r\n').map((line) => line.split(','))

describe('buildGuestListCsv', () => {
  it('has one column per event RSVP and per question, labelled with the event', () => {
    const [header] = parse(buildGuestListCsv(buildData()))

    expect(header).toEqual([
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
      'RSVP: Ceremony',
      'RSVP: Reception',
      'Reception: Meal choice',
      'Ceremony: Song request',
      'Dietary needs (household)',
    ])
  })

  it('groups households by primary contact, primary first, and fills RSVPs and answers', () => {
    const rows = parse(buildGuestListCsv(buildData())).slice(1)

    expect(rows.map((row) => `${row[0]} ${row[1]}`)).toEqual([
      'Bea Adams',
      'José Ruiz',
      'Ana Ruiz',
      'Leo Ruiz',
    ])

    const [bea, jose, ana, leo] = rows
    expect(jose).toEqual([
      'José',
      'Ruiz',
      'José Ruiz',
      'Yes',
      'Adult',
      'No',
      'Bride side; Family',
      'jose@example.com',
      '',
      '',
      '',
      'Puebla',
      '',
      '',
      '',
      'Attending',
      'Attending',
      'Fish',
      '',
      'Nut allergy',
    ])
    expect(ana?.slice(15)).toEqual(['Declined', 'No response', '', '', 'Nut allergy'])
    expect(leo?.slice(15)).toEqual(['Not invited', 'Attending', 'Kids menu', '', 'Nut allergy'])
    // Another household's general answer must not leak into this one
    expect(bea?.slice(15)).toEqual(['Attending', 'Not invited', '', '', ''])
  })

  it('escapes values and neutralizes spreadsheet formulas', () => {
    const data = buildData()
    data.guests = [guest({ id: 9, firstName: '=HYPERLINK("x")', lastName: 'O,Neil' })]

    const [, row] = buildGuestListCsv(data).split('\r\n')

    expect(row?.startsWith(`"'=HYPERLINK(""x"")","O,Neil"`)).toBe(true)
  })
})

describe('buildEventGuestCsv', () => {
  it('lists only invited guests with that event questions then general ones, no contact details', () => {
    const lines = parse(buildEventGuestCsv(buildData(), 'reception'))

    expect(lines).toEqual([
      [
        'First Name',
        'Last Name',
        'Household',
        'Age Group',
        'Tag-along',
        'RSVP',
        'Meal choice',
        'Dietary needs (household)',
      ],
      ['José', 'Ruiz', 'José Ruiz', 'Adult', 'No', 'Attending', 'Fish', 'Nut allergy'],
      ['Ana', 'Ruiz', 'José Ruiz', 'Adult', 'No', 'No response', '', 'Nut allergy'],
      ['Leo', 'Ruiz', 'José Ruiz', 'Child', 'No', 'Attending', 'Kids menu', 'Nut allergy'],
    ])
  })

  it('returns only the header when nobody is invited', () => {
    expect(buildEventGuestCsv(buildData(), 'missing').split('\r\n')).toHaveLength(1)
  })
})
