/**
 * Dashboard Application Service
 *
 * Aggregates data from multiple domains to provide a comprehensive
 * dashboard overview. This service orchestrates:
 * - User domain (user profile data)
 * - Website domain (website settings and questions)
 * - Event domain (events with questions)
 * - Household domain (households with guests)
 * - Guest domain (guest counts)
 * - Invitation domain (RSVP statistics)
 *
 * This service was extracted from the legacy dashboard router to properly
 * separate application-level orchestration from domain logic.
 */

import { type PrismaClient } from '@prisma/client'

import { calculateDaysRemaining, formatDateNumber } from '~/app/utils/helpers'
import {
  type DashboardData,
  type EventWithStats,
  type GuestResponses,
  type HouseholdWithGuests,
  type QuestionWithRecentAnswer,
  type WebsiteWithQuestions,
  type WeddingData,
} from '~/server/application/dashboard/dashboard.types'

// Import Prisma types for type annotations
type Event = {
  id: string
  name: string
  date: Date | null
  startTime: string | null
  endTime: string | null
  venue: string | null
  attire: string | null
  description: string | null
  userId: string
  collectRsvp: boolean
  questions: Array<{
    id: string
    eventId: string | null
    websiteId: string | null
    text: string
    type: string
    isRequired: boolean
    options: Array<{
      id: string
      questionId: string
      text: string
      description: string | null
      responseCount: number
    }>
    _count: { answers: number }
  }>
}

type Guest = {
  id: number
  firstName: string
  lastName: string
  isPrimaryContact: boolean
  householdId: string
  userId: string
}

type Household = {
  id: string
  address1: string | null
  address2: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  phone: string | null
  email: string | null
  notes: string | null
  guests: Guest[]
  gifts: Array<{
    householdId: string
    eventId: string
    description: string | null
    thankyou: boolean
    event: { name: string }
  }>
}

type Invitation = {
  guestId: number
  eventId: string
  rsvp: string
  invitedAt: Date | null
  updatedAt: Date
  userId: string
}

type Question = {
  id: string
  eventId: string | null
  websiteId: string | null
  text: string
  type: string
  isRequired: boolean
  options: Array<{
    id: string
    questionId: string
    text: string
    description: string | null
    responseCount: number
  }>
  _count: { answers: number }
}

export class DashboardService {
  constructor(private db: PrismaClient) {}

  /**
   * Get complete dashboard overview data for a user
   *
   * Aggregates data from multiple domains in parallel where possible
   * to optimize performance.
   */
  async getOverview(userId: string): Promise<DashboardData | null> {
    // Fetch all data in parallel
    const [households, invitations, events, currentUser, website] = await Promise.all([
      this.fetchHouseholds(userId),
      this.fetchInvitations(userId),
      this.fetchEvents(userId),
      this.fetchUser(userId),
      this.fetchWebsite(userId),
    ])

    if (!currentUser || !website) {
      return null
    }

    // Get wedding date from "Wedding Day" event
    const weddingDate = events.find((event: Event) => event.name === 'Wedding Day')?.date

    // Build wedding data
    const weddingData = await this.buildWeddingData(
      website,
      currentUser,
      weddingDate
    )

    // Build households with guest invitations
    const householdsWithInvitations = this.buildHouseholdsWithInvitations(
      households,
      invitations
    )

    // Build events with RSVP statistics
    const eventsWithStats = await this.buildEventsWithStats(events, invitations)

    // Get total guest count
    const totalGuests = await this.db.guest.count({
      where: { userId },
    })

    return {
      weddingData,
      totalGuests,
      totalEvents: events.length,
      households: householdsWithInvitations,
      events: eventsWithStats,
    }
  }

  /**
   * Fetch all households for a user with guests and gifts
   */
  private async fetchHouseholds(userId: string): Promise<Household[]> {
    return this.db.household.findMany({
      where: { userId },
      select: {
        id: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        phone: true,
        email: true,
        notes: true,
        guests: {
          orderBy: { firstName: 'asc' },
        },
        gifts: {
          include: {
            event: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Fetch all invitations for a user
   */
  private async fetchInvitations(userId: string): Promise<Invitation[]> {
    return this.db.invitation.findMany({
      where: { userId },
    })
  }

  /**
   * Fetch all events for a user with questions
   */
  private async fetchEvents(userId: string): Promise<Event[]> {
    return this.db.event.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        questions: {
          orderBy: { createdAt: 'asc' },
          include: {
            options: true,
            _count: {
              select: { answers: true },
            },
          },
        },
      },
    })
  }

  /**
   * Fetch user by ID
   */
  private async fetchUser(userId: string) {
    return this.db.user.findFirst({
      where: { id: userId },
    })
  }

  /**
   * Fetch website for a user with general questions
   */
  private async fetchWebsite(userId: string) {
    return this.db.website.findFirst({
      where: { userId },
      include: {
        generalQuestions: {
          orderBy: { createdAt: 'asc' },
          include: {
            options: true,
            _count: {
              select: { answers: true },
            },
          },
        },
      },
    })
  }

  /**
   * Build wedding data with recent answers for questions
   */
  private async buildWeddingData(
    website: NonNullable<Awaited<ReturnType<typeof this.fetchWebsite>>>,
    currentUser: NonNullable<Awaited<ReturnType<typeof this.fetchUser>>>,
    weddingDate: Date | null | undefined
  ): Promise<WeddingData> {
    // Add recent answers to general questions
    const questionsWithRecentAnswers: QuestionWithRecentAnswer[] = await Promise.all(
      website.generalQuestions.map(async (question: Question) => {
        const recentAnswer = await this.db.answer.findFirst({
          where: { questionId: question.id },
          orderBy: { createdAt: 'desc' },
          take: 1,
        })
        return {
          ...question,
          recentAnswer,
        } as QuestionWithRecentAnswer
      })
    )

    const websiteWithQuestions: WebsiteWithQuestions = {
      ...website,
      generalQuestions: questionsWithRecentAnswers,
    }

    return {
      website: websiteWithQuestions,
      groomFirstName: currentUser.groomFirstName,
      groomLastName: currentUser.groomLastName,
      brideFirstName: currentUser.brideFirstName,
      brideLastName: currentUser.brideLastName,
      date: {
        standardFormat: weddingDate?.toLocaleDateString('en-us', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        numberFormat: formatDateNumber(weddingDate),
      },
      daysRemaining: calculateDaysRemaining(weddingDate) ?? -1,
    }
  }

  /**
   * Build households with guest invitations merged in
   */
  private buildHouseholdsWithInvitations(
    households: Household[],
    invitations: Invitation[]
  ): HouseholdWithGuests[] {
    return households.map((household: Household) => ({
      ...household,
      guests: household.guests.map((guest: Guest) => ({
        ...guest,
        invitations: invitations.filter(
          (invitation: Invitation) => guest.id === invitation.guestId
        ),
      })),
    }))
  }

  /**
   * Build events with RSVP statistics and recent answers
   */
  private async buildEventsWithStats(
    events: Event[],
    invitations: Invitation[]
  ): Promise<EventWithStats[]> {
    return Promise.all(
      events.map(async (event: Event) => {
        // Calculate RSVP statistics
        const guestResponses = this.calculateGuestResponses(event.id, invitations)

        // Add recent answers to questions
        const questionsWithRecentAnswers: QuestionWithRecentAnswer[] = await Promise.all(
          event.questions.map(async (question: Question) => {
            const recentAnswer = await this.db.answer.findFirst({
              where: { questionId: question.id },
              orderBy: { createdAt: 'desc' },
              take: 1,
            })
            return {
              ...question,
              recentAnswer,
            } as QuestionWithRecentAnswer
          })
        )

        return {
          ...event,
          questions: questionsWithRecentAnswers,
          guestResponses,
        }
      })
    )
  }

  /**
   * Calculate RSVP response statistics for an event
   */
  private calculateGuestResponses(eventId: string, invitations: Invitation[]): GuestResponses {
    const responses: GuestResponses = {
      invited: 0,
      attending: 0,
      declined: 0,
      notInvited: 0,
    }

    invitations.forEach((invitation: Invitation) => {
      if (invitation.eventId === eventId) {
        switch (invitation.rsvp) {
          case 'Invited':
            responses.invited += 1
            break
          case 'Attending':
            responses.attending += 1
            break
          case 'Declined':
            responses.declined += 1
            break
          default:
            responses.notInvited += 1
            break
        }
      }
    })

    return responses
  }
}
