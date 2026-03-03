/**
 * Module augmentations for Jest manual mocks.
 *
 * These declarations extend the real module types to include mock helpers
 * (mockXxx, resetMocks) that are exported by the __mocks__ files but not
 * present in the real modules. Only included via tsconfig.test.json.
 */

// ---------------------------------------------------------------------------
// ~/server/domains/event/event.repository
// ---------------------------------------------------------------------------
declare module '~/server/domains/event/event.repository' {
  import type { Event, EventWithStats } from '~/server/domains/event/event.types'

  export const mockEvent: Event
  export const mockEventWithStats: EventWithStats
  export const mockGuests: unknown[]
  export const mockFindById: jest.Mock
  export const mockFindByIdWithQuestions: jest.Mock
  export const mockFindByWeddingId: jest.Mock
  export const mockFindByWeddingIdWithQuestions: jest.Mock
  export const mockFindByWeddingIdWithStats: jest.Mock
  export const mockCreate: jest.Mock
  export const mockUpdate: jest.Mock
  export const mockUpdateCollectRsvp: jest.Mock
  export const mockDelete: jest.Mock
  export const mockExists: jest.Mock
  export const mockBelongsToWedding: jest.Mock
  export const resetMocks: () => void
}

// ---------------------------------------------------------------------------
// ~/server/domains/event/event.service
// ---------------------------------------------------------------------------
declare module '~/server/domains/event/event.service' {
  export const mockCreateEvent: jest.Mock
  export const mockGetById: jest.Mock
  export const mockGetAllByWeddingId: jest.Mock
  export const mockUpdateEvent: jest.Mock
  export const mockDeleteEvent: jest.Mock
  export const mockUpdateCollectRsvp: jest.Mock
  export const resetMocks: () => void
}

// ---------------------------------------------------------------------------
// ~/server/domains/gift/gift.repository
// ---------------------------------------------------------------------------
declare module '~/server/domains/gift/gift.repository' {
  import type { Gift } from '~/server/domains/gift/gift.types'

  export const mockGift: Gift
  export const mockFindById: jest.Mock
  export const mockFindByHouseholdId: jest.Mock
  export const mockFindByEventId: jest.Mock
  export const mockCreate: jest.Mock
  export const mockCreateMany: jest.Mock
  export const mockUpdate: jest.Mock
  export const mockUpsert: jest.Mock
  export const mockDelete: jest.Mock
  export const mockExists: jest.Mock
  export const resetMocks: () => void
}

// ---------------------------------------------------------------------------
// ~/server/domains/guest-tag/guest-tag.repository
// ---------------------------------------------------------------------------
declare module '~/server/domains/guest-tag/guest-tag.repository' {
  import type { GuestTag } from '~/server/domains/guest-tag/guest-tag.types'

  export const mockGuestTag: GuestTag
  export const mockGuestTagWithCount: GuestTag & { _count: { guestTagAssignments: number } }
  export const mockCreate: jest.Mock
  export const mockFindById: jest.Mock
  export const mockFindByWeddingId: jest.Mock
  export const mockUpdate: jest.Mock
  export const mockDelete: jest.Mock
  export const mockExistsByName: jest.Mock
  export const resetMocks: () => void
}

// ---------------------------------------------------------------------------
// ~/server/domains/guest-tag/guest-tag.service
// ---------------------------------------------------------------------------
declare module '~/server/domains/guest-tag/guest-tag.service' {
  export const mockCreate: jest.Mock
  export const mockGetByWeddingId: jest.Mock
  export const mockGetByIdWithCount: jest.Mock
  export const mockUpdate: jest.Mock
  export const mockDelete: jest.Mock
  export const mockSeedInitialTags: jest.Mock
  export const resetMocks: () => void
}

// ---------------------------------------------------------------------------
// ~/server/domains/guest/guest.repository
// ---------------------------------------------------------------------------
declare module '~/server/domains/guest/guest.repository' {
  import type { Guest, GuestWithInvitations } from '~/server/domains/guest/guest.types'

  export const mockGuest: Guest
  export const mockGuestWithInvitations: GuestWithInvitations
  export const mockFindById: jest.Mock
  export const mockFindByIdWithInvitations: jest.Mock
  export const mockFindByWeddingId: jest.Mock
  export const mockFindByHouseholdId: jest.Mock
  export const mockFindByHouseholdIdWithInvitations: jest.Mock
  export const mockCreate: jest.Mock
  export const mockUpdate: jest.Mock
  export const mockUpdateTags: jest.Mock
  export const mockUpsert: jest.Mock
  export const mockDelete: jest.Mock
  export const mockDeleteMany: jest.Mock
  export const mockExists: jest.Mock
  export const mockBelongsToWedding: jest.Mock
  export const mockCountByWeddingId: jest.Mock
  export const resetMocks: () => void
}

// ---------------------------------------------------------------------------
// ~/server/domains/household/household.repository
// ---------------------------------------------------------------------------
declare module '~/server/domains/household/household.repository' {
  import type {
    Household,
    HouseholdSearchResult,
    HouseholdWithGuestsAndGifts,
  } from '~/server/domains/household/household.types'

  export const mockHousehold: Household
  export const mockHouseholdWithGuestsAndGifts: HouseholdWithGuestsAndGifts
  export const mockSearchResult: HouseholdSearchResult
  export const mockFindById: jest.Mock
  export const mockFindByIdWithGuestsAndGifts: jest.Mock
  export const mockFindByWeddingId: jest.Mock
  export const mockFindByWeddingIdWithGuestsAndGifts: jest.Mock
  export const mockCreate: jest.Mock
  export const mockCreateWithGifts: jest.Mock
  export const mockUpdate: jest.Mock
  export const mockDelete: jest.Mock
  export const mockSearch: jest.Mock
  export const mockExists: jest.Mock
  export const mockBelongsToUser: jest.Mock
  export const resetMocks: () => void
}

// ---------------------------------------------------------------------------
// ~/server/domains/invitation/invitation.repository
// ---------------------------------------------------------------------------
declare module '~/server/domains/invitation/invitation.repository' {
  import type { Invitation } from '~/server/domains/invitation/invitation.types'

  export const mockInvitation: Invitation
  export const mockRsvpStats: {
    attending: number
    invited: number
    declined: number
    notInvited: number
  }
  export const mockFindById: jest.Mock
  export const mockFindByWeddingId: jest.Mock
  export const mockFindByEventId: jest.Mock
  export const mockFindByGuestId: jest.Mock
  export const mockCreate: jest.Mock
  export const mockCreateMany: jest.Mock
  export const mockUpdate: jest.Mock
  export const mockDelete: jest.Mock
  export const mockExists: jest.Mock
  export const mockGetRsvpCountsByEventId: jest.Mock
  export const resetMocks: () => void
}

// ---------------------------------------------------------------------------
// ~/server/domains/question/question.repository
// ---------------------------------------------------------------------------
declare module '~/server/domains/question/question.repository' {
  import type {
    Answer,
    Question,
    QuestionWithOptions,
  } from '~/server/domains/question/question.types'

  export const mockQuestion: Question
  export const mockWebsiteQuestion: Question
  export const mockQuestionWithOptions: QuestionWithOptions
  export const mockAnswer: Answer
  export const mockFindById: jest.Mock
  export const mockFindByIdWithOptions: jest.Mock
  export const mockFindByEventId: jest.Mock
  export const mockFindByWebsiteId: jest.Mock
  export const mockDeleteOptions: jest.Mock
  export const mockUpsert: jest.Mock
  export const mockDelete: jest.Mock
  export const mockExists: jest.Mock
  export const mockFindMostRecentAnswerByQuestionId: jest.Mock
  export const resetMocks: () => void
}

// ---------------------------------------------------------------------------
// ~/server/domains/user/user.repository
// ---------------------------------------------------------------------------
declare module '~/server/domains/user/user.repository' {
  import type { User } from '~/server/domains/user/user.types'

  export const mockUser: User
  export const mockFindById: jest.Mock
  export const mockFindByEmail: jest.Mock
  export const mockCreate: jest.Mock
  export const mockUpdate: jest.Mock
  export const mockExists: jest.Mock
  export const resetMocks: () => void
}

// ---------------------------------------------------------------------------
// ~/server/domains/user/user.service
// ---------------------------------------------------------------------------
declare module '~/server/domains/user/user.service' {
  export const mockCreate: jest.Mock
  export const mockGetById: jest.Mock
  export const mockGetByEmail: jest.Mock
  export const mockUpdateProfile: jest.Mock
  export const resetMocks: () => void
}

// ---------------------------------------------------------------------------
// ~/server/domains/website/website.repository
// ---------------------------------------------------------------------------
declare module '~/server/domains/website/website.repository' {
  import type { Website, WebsiteWithQuestions } from '~/server/domains/website/website.types'

  export const mockWebsite: Website
  export const mockWebsiteWithQuestions: WebsiteWithQuestions
  export const mockFindById: jest.Mock
  export const mockFindByWeddingId: jest.Mock
  export const mockFindBySubUrl: jest.Mock
  export const mockFindBySubUrlWithQuestions: jest.Mock
  export const mockFindByWeddingIdWithQuestions: jest.Mock
  export const mockCreate: jest.Mock
  export const mockUpdate: jest.Mock
  export const mockUpdateRsvpEnabled: jest.Mock
  export const mockUpdateCoverPhoto: jest.Mock
  export const mockExistsForWedding: jest.Mock
  export const mockIsSubUrlTaken: jest.Mock
  export const resetMocks: () => void
}

// ---------------------------------------------------------------------------
// ~/server/domains/wedding/wedding.repository
// ---------------------------------------------------------------------------
declare module '~/server/domains/wedding/wedding.repository' {
  import type { Wedding } from '~/server/domains/wedding/wedding.types'

  export const mockWedding: Wedding
  export const mockUserWedding: {
    id: string
    userId: string
    weddingId: string
    role: string
    isPrimary: boolean
    createdAt: Date
    updatedAt: Date
  }
  export const mockFindById: jest.Mock
  export const mockFindByUserId: jest.Mock
  export const mockCreate: jest.Mock
  export const mockUpdate: jest.Mock
  export const mockExistsForUser: jest.Mock
  export const resetMocks: () => void
}

// ---------------------------------------------------------------------------
// ~/server/infrastructure/database/client
// ---------------------------------------------------------------------------
declare module '~/server/infrastructure/database/client' {
  export const mockUserFindUnique: jest.Mock
  export const mockUserFindFirst: jest.Mock
  export const mockUserFindMany: jest.Mock
  export const mockUserCreate: jest.Mock
  export const mockUserUpdate: jest.Mock
  export const mockUserDelete: jest.Mock
  export const mockEventFindUnique: jest.Mock
  export const mockEventFindFirst: jest.Mock
  export const mockEventFindMany: jest.Mock
  export const mockEventCreate: jest.Mock
  export const mockEventUpdate: jest.Mock
  export const mockEventDelete: jest.Mock
  export const mockGuestFindUnique: jest.Mock
  export const mockGuestFindMany: jest.Mock
  export const mockGuestUpdateMany: jest.Mock
  export const mockGuestTagAssignmentCreateMany: jest.Mock
  export const mockGuestTagAssignmentDeleteMany: jest.Mock
  export const mockWeddingFindUnique: jest.Mock
  export const mockWeddingFindFirst: jest.Mock
  export const mockWeddingCreate: jest.Mock
  export const mockWeddingUpdate: jest.Mock
  export const mockInvitationCreate: jest.Mock
  export const resetMocks: () => void
}
