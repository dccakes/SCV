import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type SeedFixture = {
  users: Array<{
    firstName: string
    email: string
    password: string
    role: 'owner' | 'admin' | 'member' | 'viewer'
  }>
  wedding: { groomFirstName: string; brideFirstName: string }
  events: Array<{ slug: string; name: string }>
  households: Array<{
    guests: Array<{
      firstName: string
      lastName: string
      email: string | null
      phone: string | null
    }>
  }>
  vendors: Array<{ category: string }>
  questions: {
    event: Array<{ slug: string }>
    website: Array<{ slug: string }>
  }
  responses: Array<{ questionSlug: string }>
}

const fixturePath = resolve(process.cwd(), 'prisma/seed-fixture.json')

function readFixture(): SeedFixture {
  const raw = readFileSync(fixturePath, 'utf-8')
  return JSON.parse(raw) as SeedFixture
}

describe('Shrek and Fiona seed fixture', () => {
  it('exists at prisma/seed-fixture.json', () => {
    expect(existsSync(fixturePath)).toBe(true)
  })

  it('includes the Shrek and Fiona wedding with three core events', () => {
    const fixture = readFixture()

    expect(fixture.users.map((user) => user.email)).toEqual(
      expect.arrayContaining(['shrek@swamp.wed', 'fiona@swamp.wed', 'queen.lillian@swamp.wed'])
    )
    expect(fixture.users.every((user) => user.password === 'password123')).toBe(true)
    expect(fixture.users.find((user) => user.email === 'shrek@swamp.wed')?.role).toBe('owner')
    expect(fixture.users.find((user) => user.email === 'fiona@swamp.wed')?.role).toBe('member')
    expect(fixture.users.find((user) => user.email === 'queen.lillian@swamp.wed')?.role).toBe(
      'viewer'
    )

    expect(fixture.wedding.groomFirstName).toBe('Shrek')
    expect(fixture.wedding.brideFirstName).toBe('Fiona')

    expect(fixture.events.map((event) => event.name)).toEqual(
      expect.arrayContaining(['Swamp Ceremony', 'Welcome Feast', 'Morning-After Breakfast'])
    )
  })

  it('covers household contact variety and RSVP custom questions', () => {
    const fixture = readFixture()

    const guests = fixture.households.flatMap((household) => household.guests)
    expect(guests.some((guest) => guest.email && guest.phone)).toBe(true)
    expect(guests.some((guest) => guest.email && !guest.phone)).toBe(true)
    expect(guests.some((guest) => !guest.email && guest.phone)).toBe(true)
    expect(guests.some((guest) => !guest.email && !guest.phone)).toBe(true)

    const allQuestionSlugs = new Set([
      ...fixture.questions.event.map((question) => question.slug),
      ...fixture.questions.website.map((question) => question.slug),
    ])

    expect(fixture.questions.event.length).toBeGreaterThan(0)
    expect(fixture.questions.website.length).toBeGreaterThan(0)
    expect(fixture.responses.length).toBeGreaterThan(0)
    expect(fixture.responses.every((response) => allQuestionSlugs.has(response.questionSlug))).toBe(
      true
    )
  })

  it('includes vendors across multiple categories', () => {
    const fixture = readFixture()
    const categories = new Set(fixture.vendors.map((vendor) => vendor.category))
    const venueCount = fixture.vendors.filter((vendor) => vendor.category === 'VENUE').length

    expect(venueCount).toBeGreaterThan(1)
    expect(categories.has('VENUE')).toBe(true)
    expect(categories.has('CATERING')).toBe(true)
    expect(categories.has('PHOTOGRAPHER')).toBe(true)
    expect(categories.has('MUSIC')).toBe(true)
  })

  it('includes requested invitees in the guest list', () => {
    const fixture = readFixture()
    const names = fixture.households
      .flatMap((household) => household.guests)
      .map((guest) => `${guest.firstName} ${guest.lastName}`)

    expect(names).toEqual(expect.arrayContaining(['Prince Charming', 'Captain Hook', 'Papa Bear']))
    expect(names).toEqual(expect.arrayContaining(['Mama Bear', 'Baby Bear']))
  })
})
