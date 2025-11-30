/**
 * Tests for Dashboard Application Service
 *
 * This service aggregates data from multiple domains for the dashboard overview.
 * Tests verify correct data aggregation and transformation using mocked repositories.
 */

import { DashboardService } from '~/server/application/dashboard/dashboard.service'

// Mock all repositories
jest.mock('~/server/domains/household/household.repository')
jest.mock('~/server/domains/invitation/invitation.repository')
jest.mock('~/server/domains/event/event.repository')
jest.mock('~/server/domains/user/user.repository')
jest.mock('~/server/domains/website/website.repository')
jest.mock('~/server/domains/guest/guest.repository')
jest.mock('~/server/domains/question/question.repository')
jest.mock('~/server/domains/wedding/wedding.repository')

// @ts-expect-error - Importing mock functions from mocked module
// @ts-expect-error - Importing mock functions from mocked module
import {
  EventRepository,
  mockFindByWeddingIdWithQuestions,
  resetMocks as resetEventMocks,
} from '~/server/domains/event/event.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  GuestRepository,
  mockCountByWeddingId,
  resetMocks as resetGuestMocks,
} from '~/server/domains/guest/guest.repository'
import {
  HouseholdRepository,
  mockFindByWeddingIdWithGuestsAndGifts,
  resetMocks as resetHouseholdMocks,
} from '~/server/domains/household/household.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  InvitationRepository,
  mockFindByWeddingId as mockInvitationFindByWeddingId,
  resetMocks as resetInvitationMocks,
} from '~/server/domains/invitation/invitation.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  mockFindMostRecentAnswerByQuestionId,
  QuestionRepository,
  resetMocks as resetQuestionMocks,
} from '~/server/domains/question/question.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  mockFindById as mockUserFindById,
  resetMocks as resetUserMocks,
  UserRepository,
} from '~/server/domains/user/user.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  mockFindByWeddingIdWithQuestions as mockWebsiteFindByWeddingIdWithQuestions,
  resetMocks as resetWebsiteMocks,
  WebsiteRepository,
} from '~/server/domains/website/website.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  mockFindByUserId,
  resetMocks as resetWeddingMocks,
  WeddingRepository,
} from '~/server/domains/wedding/wedding.repository'

// Cast to jest.Mock for type safety
const mockHouseholdFindByWeddingIdWithGuestsAndGifts =
  mockFindByWeddingIdWithGuestsAndGifts as jest.Mock
const mockInvitationFindByWeddingIdFn = mockInvitationFindByWeddingId as jest.Mock
const mockEventFindByWeddingIdWithQuestionsFn = mockFindByWeddingIdWithQuestions as jest.Mock
const mockUserFindByIdFn = mockUserFindById as jest.Mock
const mockWebsiteFindByWeddingIdWithQuestionsFn =
  mockWebsiteFindByWeddingIdWithQuestions as jest.Mock
const mockGuestCountByWeddingIdFn = mockCountByWeddingId as jest.Mock
const mockQuestionFindMostRecentAnswerFn = mockFindMostRecentAnswerByQuestionId as jest.Mock
const mockWeddingFindByUserIdFn = mockFindByUserId as jest.Mock

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  groomFirstName: 'John',
  groomLastName: 'Smith',
  brideFirstName: 'Jane',
  brideLastName: 'Doe',
  name: 'John Smith',
  emailVerified: true,
  image: null,
  websiteUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockWebsite = {
  id: 'website-123',
  weddingId: 'wedding-123',
  url: 'https://example.com',
  subUrl: 'john-jane',
  isPasswordEnabled: false,
  password: null,
  coverPhotoUrl: null,
  isRsvpEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  generalQuestions: [
    {
      id: 'question-gen-1',
      eventId: null,
      websiteId: 'website-123',
      text: 'Any dietary restrictions?',
      type: 'Text',
      isRequired: false,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    weddingId: 'wedding-123',
    collectRsvp: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    questions: [
      {
        id: 'question-event-1',
        eventId: 'event-wedding',
        websiteId: null,
        text: 'Meal preference?',
        type: 'Option',
        isRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [
          {
            id: 'opt-1',
            questionId: 'question-event-1',
            text: 'Chicken',
            description: null,
            responseCount: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'opt-2',
            questionId: 'question-event-1',
            text: 'Fish',
            description: null,
            responseCount: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
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
    weddingId: 'wedding-123',
    collectRsvp: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    questions: [],
  },
]

const mockHouseholds = [
  {
    id: 'household-1',
    weddingId: 'wedding-123',
    address1: '123 Main St',
    address2: null,
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    guests: [
      {
        id: 1,
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@example.com',
        phone: null,
        isPrimaryContact: true,
        householdId: 'household-1',
        weddingId: 'wedding-123',
        ageGroup: 'ADULT',
        createdAt: new Date(),
        updatedAt: new Date(),
        guestTagAssignments: [],
        invitations: [],
      },
      {
        id: 2,
        firstName: 'Alice',
        lastName: 'Smith',
        email: null,
        phone: null,
        isPrimaryContact: false,
        householdId: 'household-1',
        weddingId: 'wedding-123',
        ageGroup: 'ADULT',
        createdAt: new Date(),
        updatedAt: new Date(),
        guestTagAssignments: [],
        invitations: [],
      },
    ],
    gifts: [
      {
        householdId: 'household-1',
        eventId: 'event-wedding',
        description: 'Toaster',
        thankyou: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        event: { name: 'Wedding Day' },
      },
    ],
  },
  {
    id: 'household-2',
    weddingId: 'wedding-123',
    address1: '456 Oak Ave',
    address2: 'Suite 100',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90001',
    country: 'USA',
    notes: 'Family friends',
    createdAt: new Date(),
    updatedAt: new Date(),
    guests: [
      {
        id: 3,
        firstName: 'Charlie',
        lastName: 'Brown',
        email: 'charlie@example.com',
        phone: null,
        isPrimaryContact: true,
        householdId: 'household-2',
        weddingId: 'wedding-123',
        ageGroup: 'ADULT',
        createdAt: new Date(),
        updatedAt: new Date(),
        guestTagAssignments: [],
        invitations: [],
      },
    ],
    gifts: [],
  },
]

const mockInvitations = [
  {
    id: 'inv-1',
    guestId: 1,
    eventId: 'event-wedding',
    weddingId: 'wedding-123',
    rsvp: 'Attending',
    dietaryRestrictions: null,
    submittedBy: null,
    submittedAt: null,
    invitedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'inv-2',
    guestId: 2,
    eventId: 'event-wedding',
    weddingId: 'wedding-123',
    rsvp: 'Attending',
    dietaryRestrictions: null,
    submittedBy: null,
    submittedAt: null,
    invitedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'inv-3',
    guestId: 3,
    eventId: 'event-wedding',
    weddingId: 'wedding-123',
    rsvp: 'Declined',
    dietaryRestrictions: null,
    submittedBy: null,
    submittedAt: null,
    invitedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'inv-4',
    guestId: 1,
    eventId: 'event-rehearsal',
    weddingId: 'wedding-123',
    rsvp: 'Invited',
    dietaryRestrictions: null,
    submittedBy: null,
    submittedAt: null,
    invitedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'inv-5',
    guestId: 2,
    eventId: 'event-rehearsal',
    weddingId: 'wedding-123',
    rsvp: 'Not Invited',
    dietaryRestrictions: null,
    submittedBy: null,
    submittedAt: null,
    invitedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockAnswer = {
  questionId: 'question-gen-1',
  guestId: 1,
  guestFirstName: 'Bob',
  guestLastName: 'Smith',
  householdId: 'household-1',
  response: 'Vegetarian',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockWedding = {
  id: 'wedding-123',
  groomFirstName: 'John',
  groomLastName: 'Smith',
  brideFirstName: 'Jane',
  brideLastName: 'Doe',
  eventDate: new Date('2025-06-15'),
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('DashboardService', () => {
  let service: DashboardService

  beforeEach(() => {
    // Reset all mocks
    resetHouseholdMocks()
    resetInvitationMocks()
    resetEventMocks()
    resetUserMocks()
    resetWebsiteMocks()
    resetGuestMocks()
    resetQuestionMocks()
    resetWeddingMocks()

    // Create repository instances
    const householdRepo = new HouseholdRepository({} as never)
    const invitationRepo = new InvitationRepository({} as never)
    const eventRepo = new EventRepository({} as never)
    const userRepo = new UserRepository({} as never)
    const websiteRepo = new WebsiteRepository({} as never)
    const guestRepo = new GuestRepository({} as never)
    const questionRepo = new QuestionRepository({} as never)
    const weddingRepo = new WeddingRepository({} as never)

    // Setup default mock return values
    mockWeddingFindByUserIdFn.mockResolvedValue(mockWedding)
    mockHouseholdFindByWeddingIdWithGuestsAndGifts.mockResolvedValue(mockHouseholds)
    mockInvitationFindByWeddingIdFn.mockResolvedValue(mockInvitations)
    mockEventFindByWeddingIdWithQuestionsFn.mockResolvedValue(mockEvents)
    mockUserFindByIdFn.mockResolvedValue(mockUser)
    mockWebsiteFindByWeddingIdWithQuestionsFn.mockResolvedValue(mockWebsite)
    mockGuestCountByWeddingIdFn.mockResolvedValue(3)
    mockQuestionFindMostRecentAnswerFn.mockResolvedValue(mockAnswer)

    // Create service with injected repositories
    service = new DashboardService(
      householdRepo,
      invitationRepo,
      eventRepo,
      userRepo,
      websiteRepo,
      guestRepo,
      questionRepo,
      weddingRepo
    )
  })

  describe('getOverview', () => {
    it('should return null when wedding not found', async () => {
      mockWeddingFindByUserIdFn.mockResolvedValue(null)

      const result = await service.getOverview('user-123')

      expect(result).toBeNull()
    })

    it('should return null when user not found', async () => {
      mockUserFindByIdFn.mockResolvedValue(null)

      const result = await service.getOverview('user-123')

      expect(result).toBeNull()
    })

    it('should return data even when website not found', async () => {
      mockWebsiteFindByWeddingIdWithQuestionsFn.mockResolvedValue(null)

      const result = await service.getOverview('user-123')

      // Should not be null - website is optional
      expect(result).not.toBeNull()
      expect(result?.weddingData).toBeDefined()
      expect(result?.weddingData.website).toBeUndefined()
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
      expect(result?.weddingData.website.generalQuestions[0]?.text).toBe(
        'Any dietary restrictions?'
      )
    })

    it('should include recent answers for questions', async () => {
      const result = await service.getOverview('user-123')

      const question = result?.weddingData.website.generalQuestions[0]
      expect(question?.recentAnswer).toBeDefined()
      expect(question?.recentAnswer?.response).toBe('Vegetarian')
    })

    it('should merge guest invitations into households', async () => {
      const result = await service.getOverview('user-123')

      const household1 = result?.households.find((h) => h.id === 'household-1')
      expect(household1?.guests[0]?.invitations).toBeDefined()
      expect(household1?.guests[0]?.invitations).toHaveLength(2) // 2 events
    })

    it('should calculate RSVP statistics for each event', async () => {
      const result = await service.getOverview('user-123')

      const weddingEvent = result?.events.find((e) => e.id === 'event-wedding')
      expect(weddingEvent?.guestResponses).toBeDefined()
      expect(weddingEvent?.guestResponses.attending).toBe(2)
      expect(weddingEvent?.guestResponses.declined).toBe(1)
    })

    it('should count invited guests correctly', async () => {
      const result = await service.getOverview('user-123')

      const rehearsalEvent = result?.events.find((e) => e.id === 'event-rehearsal')
      expect(rehearsalEvent?.guestResponses.invited).toBe(1)
      expect(rehearsalEvent?.guestResponses.notInvited).toBe(1)
    })

    it('should include event questions with recent answers', async () => {
      const result = await service.getOverview('user-123')

      const weddingEvent = result?.events.find((e) => e.id === 'event-wedding')
      expect(weddingEvent?.questions).toHaveLength(1)
      expect(weddingEvent?.questions[0]?.text).toBe('Meal preference?')
    })

    it('should call repositories with correct weddingId', async () => {
      await service.getOverview('user-123')

      expect(mockHouseholdFindByWeddingIdWithGuestsAndGifts).toHaveBeenCalledWith('wedding-123')
      expect(mockInvitationFindByWeddingIdFn).toHaveBeenCalledWith('wedding-123')
      expect(mockEventFindByWeddingIdWithQuestionsFn).toHaveBeenCalledWith('wedding-123')
      expect(mockGuestCountByWeddingIdFn).toHaveBeenCalledWith('wedding-123')
      expect(mockWebsiteFindByWeddingIdWithQuestionsFn).toHaveBeenCalledWith('wedding-123')
    })

    it('should handle missing wedding date gracefully', async () => {
      const eventsWithoutWeddingDay = [mockEvents[1]] // Only rehearsal dinner
      mockEventFindByWeddingIdWithQuestionsFn.mockResolvedValue(eventsWithoutWeddingDay)

      const result = await service.getOverview('user-123')

      expect(result?.weddingData.date.standardFormat).toBeUndefined()
      expect(result?.weddingData.daysRemaining).toBe(-1)
    })

    it('should handle empty households', async () => {
      mockHouseholdFindByWeddingIdWithGuestsAndGifts.mockResolvedValue([])
      mockGuestCountByWeddingIdFn.mockResolvedValue(0)

      const result = await service.getOverview('user-123')

      expect(result?.households).toEqual([])
      expect(result?.totalGuests).toBe(0)
    })

    it('should handle empty events', async () => {
      mockEventFindByWeddingIdWithQuestionsFn.mockResolvedValue([])

      const result = await service.getOverview('user-123')

      expect(result?.events).toEqual([])
      expect(result?.totalEvents).toBe(0)
    })
  })
})
