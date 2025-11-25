/**
 * Tests for Dashboard Application Service
 *
 * This service aggregates data from multiple domains for the dashboard overview.
 * Tests verify correct data aggregation and transformation.
 */

import { DashboardService } from '~/server/application/dashboard/dashboard.service'

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  groomFirstName: 'John',
  groomLastName: 'Smith',
  brideFirstName: 'Jane',
  brideLastName: 'Doe',
  clerkId: 'clerk-123',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockWebsite = {
  id: 'website-123',
  userId: 'user-123',
  url: 'https://example.com',
  subUrl: 'john-jane',
  groomFirstName: 'John',
  groomLastName: 'Smith',
  brideFirstName: 'Jane',
  brideLastName: 'Doe',
  isPasswordEnabled: false,
  password: null,
  coverPhotoUrl: null,
  isRsvpEnabled: true,
  generalQuestions: [
    {
      id: 'question-gen-1',
      eventId: null,
      websiteId: 'website-123',
      text: 'Any dietary restrictions?',
      type: 'Text',
      isRequired: false,
      options: [],
      _count: { answers: 3 },
    },
  ],
}

const mockEvents = [
  {
    id: 'event-wedding',
    name: 'Wedding Day',
    date: new Date('2025-06-15'),
    startTime: '4:00 PM',
    endTime: '11:00 PM',
    venue: 'The Grand Ballroom',
    attire: 'Black Tie',
    description: 'Main wedding ceremony and reception',
    userId: 'user-123',
    collectRsvp: true,
    questions: [
      {
        id: 'question-event-1',
        eventId: 'event-wedding',
        websiteId: null,
        text: 'Meal preference?',
        type: 'Option',
        isRequired: true,
        options: [
          { id: 'opt-1', questionId: 'question-event-1', text: 'Chicken', description: null, responseCount: 10 },
          { id: 'opt-2', questionId: 'question-event-1', text: 'Fish', description: null, responseCount: 5 },
        ],
        _count: { answers: 15 },
      },
    ],
  },
  {
    id: 'event-rehearsal',
    name: 'Rehearsal Dinner',
    date: new Date('2025-06-14'),
    startTime: '6:00 PM',
    endTime: '9:00 PM',
    venue: 'Italian Restaurant',
    attire: 'Cocktail',
    description: null,
    userId: 'user-123',
    collectRsvp: true,
    questions: [],
  },
]

const mockHouseholds = [
  {
    id: 'household-1',
    address1: '123 Main St',
    address2: null,
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    phone: '555-1234',
    email: 'smith@example.com',
    notes: null,
    guests: [
      { id: 1, firstName: 'Bob', lastName: 'Smith', isPrimaryContact: true, householdId: 'household-1', userId: 'user-123' },
      { id: 2, firstName: 'Alice', lastName: 'Smith', isPrimaryContact: false, householdId: 'household-1', userId: 'user-123' },
    ],
    gifts: [
      { householdId: 'household-1', eventId: 'event-wedding', description: 'Toaster', thankyou: true, event: { name: 'Wedding Day' } },
    ],
  },
  {
    id: 'household-2',
    address1: '456 Oak Ave',
    address2: 'Suite 100',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90001',
    country: 'USA',
    phone: null,
    email: null,
    notes: 'Family friends',
    guests: [
      { id: 3, firstName: 'Charlie', lastName: 'Brown', isPrimaryContact: true, householdId: 'household-2', userId: 'user-123' },
    ],
    gifts: [],
  },
]

const mockInvitations = [
  { guestId: 1, eventId: 'event-wedding', rsvp: 'Attending', invitedAt: new Date(), updatedAt: new Date(), userId: 'user-123' },
  { guestId: 2, eventId: 'event-wedding', rsvp: 'Attending', invitedAt: new Date(), updatedAt: new Date(), userId: 'user-123' },
  { guestId: 3, eventId: 'event-wedding', rsvp: 'Declined', invitedAt: new Date(), updatedAt: new Date(), userId: 'user-123' },
  { guestId: 1, eventId: 'event-rehearsal', rsvp: 'Invited', invitedAt: null, updatedAt: new Date(), userId: 'user-123' },
  { guestId: 2, eventId: 'event-rehearsal', rsvp: 'Not Invited', invitedAt: null, updatedAt: new Date(), userId: 'user-123' },
]

const mockAnswer = {
  id: 'answer-1',
  questionId: 'question-gen-1',
  guestId: 1,
  guestFirstName: 'Bob',
  guestLastName: 'Smith',
  householdId: 'household-1',
  response: 'Vegetarian',
  createdAt: new Date(),
}

// Create mock Prisma client
const createMockDb = () => ({
  household: {
    findMany: jest.fn().mockResolvedValue(mockHouseholds),
  },
  invitation: {
    findMany: jest.fn().mockResolvedValue(mockInvitations),
  },
  event: {
    findMany: jest.fn().mockResolvedValue(mockEvents),
  },
  user: {
    findFirst: jest.fn().mockResolvedValue(mockUser),
  },
  website: {
    findFirst: jest.fn().mockResolvedValue(mockWebsite),
  },
  guest: {
    count: jest.fn().mockResolvedValue(3),
  },
  answer: {
    findFirst: jest.fn().mockResolvedValue(mockAnswer),
  },
})

describe('DashboardService', () => {
  let service: DashboardService
  let mockDb: ReturnType<typeof createMockDb>

  beforeEach(() => {
    mockDb = createMockDb()
    service = new DashboardService(mockDb as never)
  })

  describe('getOverview', () => {
    it('should return null when user not found', async () => {
      mockDb.user.findFirst.mockResolvedValue(null)

      const result = await service.getOverview('user-123')

      expect(result).toBeNull()
    })

    it('should return null when website not found', async () => {
      mockDb.website.findFirst.mockResolvedValue(null)

      const result = await service.getOverview('user-123')

      expect(result).toBeNull()
    })

    it('should return complete dashboard data', async () => {
      const result = await service.getOverview('user-123')

      expect(result).not.toBeNull()
      expect(result?.weddingData).toBeDefined()
      expect(result?.totalGuests).toBe(3)
      expect(result?.totalEvents).toBe(2)
      expect(result?.households).toHaveLength(2)
      expect(result?.events).toHaveLength(2)
    })

    it('should include wedding data with names', async () => {
      const result = await service.getOverview('user-123')

      expect(result?.weddingData.groomFirstName).toBe('John')
      expect(result?.weddingData.groomLastName).toBe('Smith')
      expect(result?.weddingData.brideFirstName).toBe('Jane')
      expect(result?.weddingData.brideLastName).toBe('Doe')
    })

    it('should include formatted wedding date', async () => {
      const result = await service.getOverview('user-123')

      expect(result?.weddingData.date).toBeDefined()
      expect(result?.weddingData.date.standardFormat).toContain('2025')
    })

    it('should calculate days remaining', async () => {
      const result = await service.getOverview('user-123')

      // Days remaining should be calculated (will vary based on current date)
      expect(result?.weddingData.daysRemaining).toBeDefined()
    })

    it('should include website with general questions', async () => {
      const result = await service.getOverview('user-123')

      expect(result?.weddingData.website).toBeDefined()
      expect(result?.weddingData.website.generalQuestions).toHaveLength(1)
      expect(result?.weddingData.website.generalQuestions[0]?.text).toBe('Any dietary restrictions?')
    })

    it('should include recent answers for questions', async () => {
      const result = await service.getOverview('user-123')

      const question = result?.weddingData.website.generalQuestions[0]
      expect(question?.recentAnswer).toBeDefined()
      expect(question?.recentAnswer?.response).toBe('Vegetarian')
    })

    it('should merge guest invitations into households', async () => {
      const result = await service.getOverview('user-123')

      const household1 = result?.households.find(h => h.id === 'household-1')
      expect(household1?.guests[0]?.invitations).toBeDefined()
      expect(household1?.guests[0]?.invitations).toHaveLength(2) // 2 events
    })

    it('should calculate RSVP statistics for each event', async () => {
      const result = await service.getOverview('user-123')

      const weddingEvent = result?.events.find(e => e.id === 'event-wedding')
      expect(weddingEvent?.guestResponses).toBeDefined()
      expect(weddingEvent?.guestResponses.attending).toBe(2)
      expect(weddingEvent?.guestResponses.declined).toBe(1)
    })

    it('should count invited guests correctly', async () => {
      const result = await service.getOverview('user-123')

      const rehearsalEvent = result?.events.find(e => e.id === 'event-rehearsal')
      expect(rehearsalEvent?.guestResponses.invited).toBe(1)
      expect(rehearsalEvent?.guestResponses.notInvited).toBe(1)
    })

    it('should include event questions with recent answers', async () => {
      const result = await service.getOverview('user-123')

      const weddingEvent = result?.events.find(e => e.id === 'event-wedding')
      expect(weddingEvent?.questions).toHaveLength(1)
      expect(weddingEvent?.questions[0]?.text).toBe('Meal preference?')
    })

    it('should fetch data in parallel for performance', async () => {
      await service.getOverview('user-123')

      // All data fetching should happen (we can't directly verify parallelism,
      // but we can verify all queries are made)
      expect(mockDb.household.findMany).toHaveBeenCalledTimes(1)
      expect(mockDb.invitation.findMany).toHaveBeenCalledTimes(1)
      expect(mockDb.event.findMany).toHaveBeenCalledTimes(1)
      expect(mockDb.user.findFirst).toHaveBeenCalledTimes(1)
      expect(mockDb.website.findFirst).toHaveBeenCalledTimes(1)
    })

    it('should query with correct userId', async () => {
      await service.getOverview('different-user-456')

      expect(mockDb.household.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'different-user-456' } })
      )
      expect(mockDb.invitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'different-user-456' } })
      )
      expect(mockDb.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'different-user-456' } })
      )
    })

    it('should handle missing wedding date gracefully', async () => {
      mockDb.event.findMany.mockResolvedValue([
        { ...mockEvents[1], name: 'Rehearsal Dinner' }, // No Wedding Day event
      ])

      const result = await service.getOverview('user-123')

      expect(result?.weddingData.date.standardFormat).toBeUndefined()
      expect(result?.weddingData.daysRemaining).toBe(-1)
    })

    it('should handle empty households', async () => {
      mockDb.household.findMany.mockResolvedValue([])
      mockDb.guest.count.mockResolvedValue(0)

      const result = await service.getOverview('user-123')

      expect(result?.households).toEqual([])
      expect(result?.totalGuests).toBe(0)
    })

    it('should handle empty events', async () => {
      mockDb.event.findMany.mockResolvedValue([])

      const result = await service.getOverview('user-123')

      expect(result?.events).toEqual([])
      expect(result?.totalEvents).toBe(0)
    })
  })
})
