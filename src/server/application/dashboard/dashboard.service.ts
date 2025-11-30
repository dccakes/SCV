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

import { type Prisma, type PrismaClient } from '@prisma/client'

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

export class DashboardService {
  constructor(private db: PrismaClient) {}

  /**
   * Get complete dashboard overview data for a user
   *
   * Aggregates data from multiple domains in parallel where possible
   * to optimize performance.
   */
  async getOverview(userId: string): Promise<DashboardData | null> {
    // First, get the user's wedding
    const userWedding = await this.db.userWedding.findFirst({
      where: { userId },
      include: { wedding: true },
      orderBy: { isPrimary: 'desc' }, // Prioritize primary wedding
    })

    if (!userWedding) {
      return null
    }

    const weddingId = userWedding.weddingId

    // Fetch all data in parallel
    const [households, invitations, events, currentUser, website] = await Promise.all([
      this.fetchHouseholds(weddingId),
      this.fetchInvitations(weddingId),
      this.fetchEvents(weddingId),
      this.fetchUser(userId),
      this.fetchWebsite(weddingId),
    ])

    if (!currentUser) {
      return null
    }

    // Website is optional (it's an add-on, not Core)
    // Create default website data if it doesn't exist yet
    if (!website) {
      // TODO: Auto-create website when user accesses dashboard for first time
      // For now, return minimal wedding data without website
    }

    // Get wedding date from "Wedding Day" event
    const weddingDate = events.find((event) => event.name === 'Wedding Day')?.date

    // Build wedding data
    const weddingData = await this.buildWeddingData(website, currentUser, weddingDate)

    // Build households with guest invitations
    const householdsWithInvitations = this.buildHouseholdsWithInvitations(households, invitations)

    // Build events with RSVP statistics
    const eventsWithStats = await this.buildEventsWithStats(events, invitations)

    // Get total guest count
    const totalGuests = await this.db.guest.count({
      where: { weddingId },
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
   * Fetch all households for a wedding with guests and gifts
   */
  private async fetchHouseholds(weddingId: string) {
    return this.db.household.findMany({
      where: { weddingId },
      select: {
        id: true,
        weddingId: true,
        createdAt: true,
        updatedAt: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        notes: true,
        guests: true,
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
   * Fetch all invitations for a wedding
   */
  private async fetchInvitations(weddingId: string) {
    return this.db.invitation.findMany({
      where: { weddingId },
    })
  }

  /**
   * Fetch all events for a wedding with questions
   */
  private async fetchEvents(weddingId: string) {
    return this.db.event.findMany({
      where: { weddingId },
      include: {
        questions: {
          include: {
            options: true,
            _count: {
              select: { answers: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
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
   * Fetch website for a wedding with general questions
   */
  private async fetchWebsite(weddingId: string) {
    return this.db.website.findFirst({
      where: { weddingId },
      include: {
        generalQuestions: {
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
    website: Awaited<ReturnType<typeof this.fetchWebsite>>,
    currentUser: NonNullable<Awaited<ReturnType<typeof this.fetchUser>>>,
    weddingDate: Date | null | undefined
  ): Promise<WeddingData> {
    let websiteWithQuestions: WebsiteWithQuestions | undefined

    if (website) {
      // Add recent answers to general questions
      const questionsWithRecentAnswers: QuestionWithRecentAnswer[] = await Promise.all(
        website.generalQuestions.map(async (question) => {
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

      websiteWithQuestions = {
        ...website,
        generalQuestions: questionsWithRecentAnswers,
      }
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
    households: Awaited<ReturnType<typeof this.fetchHouseholds>>,
    invitations: Awaited<ReturnType<typeof this.fetchInvitations>>
  ): HouseholdWithGuests[] {
    return households.map((household) => ({
      ...household,
      guests: household.guests.map((guest) => ({
        ...guest,
        invitations: invitations.filter((invitation) => guest.id === invitation.guestId),
      })),
    }))
  }

  /**
   * Build events with RSVP statistics and recent answers
   */
  private async buildEventsWithStats(
    events: Awaited<ReturnType<typeof this.fetchEvents>>,
    invitations: Awaited<ReturnType<typeof this.fetchInvitations>>
  ): Promise<EventWithStats[]> {
    return Promise.all(
      events.map(async (event) => {
        // Calculate RSVP statistics
        const guestResponses = this.calculateGuestResponses(event.id, invitations)

        // Add recent answers to questions
        const questionsWithRecentAnswers: QuestionWithRecentAnswer[] = await Promise.all(
          event.questions.map(async (question) => {
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
  private calculateGuestResponses(
    eventId: string,
    invitations: Awaited<ReturnType<typeof this.fetchInvitations>>
  ): GuestResponses {
    const responses: GuestResponses = {
      invited: 0,
      attending: 0,
      declined: 0,
      notInvited: 0,
    }

    invitations.forEach((invitation) => {
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
