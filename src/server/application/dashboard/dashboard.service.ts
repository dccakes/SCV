/**
 * Dashboard Application Service
 *
 * Aggregates data from multiple domains to provide a comprehensive
 * dashboard overview. This service orchestrates:
 * - User domain (user profile data)
 * - Wedding domain (wedding and UserWedding data)
 * - Website domain (website settings and questions)
 * - Event domain (events with questions)
 * - Household domain (households with guests)
 * - Guest domain (guest counts)
 * - Invitation domain (RSVP statistics)
 * - Question domain (recent answers to questions)
 *
 * This service was extracted from the legacy dashboard router to properly
 * separate application-level orchestration from domain logic.
 */

import { calculateDaysRemaining, formatDateNumber } from '~/app/utils/helpers'
import type {
  DashboardData,
  EventWithStats,
  GuestResponses,
  HouseholdWithGuests,
  QuestionWithRecentAnswer,
  WebsiteWithQuestions,
  WeddingData,
} from '~/server/application/dashboard/dashboard.types'
import type { EventRepository } from '~/server/domains/event/event.repository'
import type { GuestRepository } from '~/server/domains/guest/guest.repository'
import type { HouseholdRepository } from '~/server/domains/household/household.repository'
import type { HouseholdWithGuestsAndGifts } from '~/server/domains/household/household.types'
import type { InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import type { Invitation } from '~/server/domains/invitation/invitation.types'
import type { MilestoneRepository } from '~/server/domains/milestone/milestone.repository'
import type { QuestionRepository } from '~/server/domains/question/question.repository'
import { buildTaskPriorityQueue, countTasksDueThisMonth } from '~/server/domains/task/task.priority'
import type { TaskRepository } from '~/server/domains/task/task.repository'
import type { UserRepository } from '~/server/domains/user/user.repository'
import type { WebsiteRepository } from '~/server/domains/website/website.repository'
import { computeWebsiteUrl } from '~/server/domains/website/website.utils'
import type { WeddingRepository } from '~/server/domains/wedding/wedding.repository'

export class DashboardService {
  constructor(
    private householdRepo: HouseholdRepository,
    private invitationRepo: InvitationRepository,
    private eventRepo: EventRepository,
    private userRepo: UserRepository,
    private websiteRepo: WebsiteRepository,
    private guestRepo: GuestRepository,
    private questionRepo: QuestionRepository,
    private weddingRepo: WeddingRepository,
    private taskRepo: TaskRepository,
    private milestoneRepo: MilestoneRepository
  ) {}

  /**
   * Scoped entrypoint: returns dashboard overview for a specific wedding id.
   * This is the primary path for protected workspace routes.
   */
  async getOverviewForScopedWedding(
    userId: string,
    weddingId: string
  ): Promise<DashboardData | null> {
    const wedding = await this.weddingRepo.findById(weddingId)
    if (!wedding) {
      return null
    }
    return this.getOverviewForWedding(userId, wedding)
  }

  /**
   * Get complete dashboard overview data for a resolved wedding.
   *
   * Aggregates data from multiple domains in parallel where possible
   * to optimize performance.
   */
  private async getOverviewForWedding(
    userId: string,
    wedding: {
      id: string
      groomFirstName: string
      groomLastName: string
      brideFirstName: string
      brideLastName: string
    }
  ): Promise<DashboardData | null> {
    const weddingId = wedding.id

    // Fetch all data in parallel
    const [households, invitations, events, currentUser, website, taskCandidates, milestones] =
      await Promise.all([
        this.fetchHouseholds(weddingId),
        this.fetchInvitations(weddingId),
        this.fetchEvents(weddingId),
        this.fetchUser(userId),
        this.fetchWebsite(weddingId),
        this.fetchTaskPriorityCandidates(weddingId),
        this.fetchMilestones(weddingId),
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

    // Get wedding date and location from the first event (created as "Ceremony" during onboarding)
    const primaryEvent = events[0]
    const weddingDate = primaryEvent?.date
    const weddingLocation = primaryEvent?.venue

    // Build wedding data (names come from the Wedding entity, not the User)
    const weddingData = await this.buildWeddingData(website, wedding, weddingDate, weddingLocation)

    // Build households with guest invitations
    const householdsWithInvitations = this.buildHouseholdsWithInvitations(households, invitations)

    // Build events with RSVP statistics
    const eventsWithStats = await this.buildEventsWithStats(events, invitations)
    const taskPriorityQueue = buildTaskPriorityQueue(taskCandidates)
    const tasksDueThisMonth = countTasksDueThisMonth(taskCandidates)

    // Get total guest count (excluding tag-alongs)
    const totalGuests = await this.guestRepo.countByWeddingId(weddingId, {
      excludeTagAlongs: true,
    })

    return {
      weddingData,
      totalGuests,
      totalEvents: events.length,
      tasksDueThisMonth,
      taskPriorityQueue,
      milestones,
      households: householdsWithInvitations,
      events: eventsWithStats,
    }
  }

  /**
   * Fetch all households for a wedding with guests and gifts
   */
  private async fetchHouseholds(weddingId: string): Promise<HouseholdWithGuestsAndGifts[]> {
    return this.householdRepo.findByWeddingIdWithGuestsAndGifts(weddingId)
  }

  /**
   * Fetch all invitations for a wedding with tag-along guest info
   */
  private async fetchInvitations(
    weddingId: string
  ): Promise<Array<Invitation & { guest: { isTagAlong: boolean } }>> {
    return this.invitationRepo.findByWeddingIdWithGuestTagAlong(weddingId)
  }

  /**
   * Fetch all events for a wedding with questions
   */
  private async fetchEvents(weddingId: string) {
    return this.eventRepo.findByWeddingIdWithQuestions(weddingId)
  }

  /**
   * Fetch user by ID
   */
  private async fetchUser(userId: string) {
    return this.userRepo.findById(userId)
  }

  /**
   * Fetch website for a wedding with general questions
   */
  private async fetchWebsite(weddingId: string) {
    return this.websiteRepo.findByWeddingIdWithQuestions(weddingId)
  }

  private async fetchTaskPriorityCandidates(weddingId: string) {
    return this.taskRepo.findPriorityQueueCandidates(weddingId)
  }

  private async fetchMilestones(weddingId: string) {
    return this.milestoneRepo.findByWeddingIdWithEffectiveStatus(weddingId)
  }

  /**
   * Build wedding data with recent answers for questions
   */
  private async buildWeddingData(
    website: Awaited<ReturnType<typeof this.fetchWebsite>>,
    wedding: {
      groomFirstName: string
      groomLastName: string
      brideFirstName: string
      brideLastName: string
    },
    weddingDate: Date | null | undefined,
    weddingLocation: string | null | undefined
  ): Promise<WeddingData> {
    let websiteWithQuestions: WebsiteWithQuestions | undefined

    if (website) {
      // Add recent answers to general questions
      const questionsWithRecentAnswers: QuestionWithRecentAnswer[] = await Promise.all(
        website.generalQuestions.map(async (question) => {
          // Questions from database always have IDs
          const recentAnswer = await this.questionRepo.findMostRecentAnswerByQuestionId(
            question.id ?? ''
          )
          return {
            ...question,
            recentAnswer,
          } as QuestionWithRecentAnswer
        })
      )

      websiteWithQuestions = {
        ...website,
        url: computeWebsiteUrl(website.subUrl),
        generalQuestions: questionsWithRecentAnswers,
      }
    }

    return {
      website: websiteWithQuestions,
      groomFirstName: wedding.groomFirstName,
      groomLastName: wedding.groomLastName,
      brideFirstName: wedding.brideFirstName,
      brideLastName: wedding.brideLastName,
      date: {
        standardFormat: weddingDate?.toLocaleDateString('en-us', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        numberFormat: formatDateNumber(weddingDate),
      },
      location: weddingLocation ?? null,
      daysRemaining: calculateDaysRemaining(weddingDate) ?? -1,
    }
  }

  /**
   * Build households with guest invitations merged in
   */
  private buildHouseholdsWithInvitations(
    households: HouseholdWithGuestsAndGifts[],
    invitations: Array<Invitation & { guest: { isTagAlong: boolean } }>
  ): HouseholdWithGuests[] {
    return households.map((household) => ({
      ...household,
      guests: household.guests.map((guest) => {
        // Prisma returns guestTagAssignments[].guestTagId but the domain type
        // exposes guestTags[].tagId — map between them here.
        const raw = guest as typeof guest & { guestTagAssignments?: Array<{ guestTagId: string }> }
        return {
          ...guest,
          invitations: invitations.filter((invitation) => guest.id === invitation.guestId),
          guestTags:
            raw.guestTagAssignments?.map(({ guestTagId }) => ({ tagId: guestTagId })) ?? [],
        }
      }),
    }))
  }

  /**
   * Build events with RSVP statistics and recent answers
   */
  private async buildEventsWithStats(
    events: Awaited<ReturnType<typeof this.fetchEvents>>,
    invitations: Array<Invitation & { guest: { isTagAlong: boolean } }>
  ): Promise<EventWithStats[]> {
    return Promise.all(
      events.map(async (event) => {
        // Calculate RSVP statistics (filter tag-alongs when event doesn't allow them)
        const guestResponses = this.calculateGuestResponses(
          event.id,
          invitations,
          event.allowTagAlongs
        )

        // Add recent answers to questions
        const questionsWithRecentAnswers: QuestionWithRecentAnswer[] = await Promise.all(
          event.questions.map(async (question) => {
            // Questions from database always have IDs
            const recentAnswer = await this.questionRepo.findMostRecentAnswerByQuestionId(
              question.id ?? ''
            )
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
   *
   * When allowTagAlongs is false, tag-along guest invitations are excluded
   * from counts (preserved data is hidden from stats).
   */
  private calculateGuestResponses(
    eventId: string,
    invitations: Array<Invitation & { guest: { isTagAlong: boolean } }>,
    allowTagAlongs: boolean
  ): GuestResponses {
    const responses: GuestResponses = {
      invited: 0,
      attending: 0,
      declined: 0,
      notInvited: 0,
    }

    invitations.forEach((invitation) => {
      if (invitation.eventId !== eventId) return
      // Skip tag-along invitations when event doesn't allow them
      if (!allowTagAlongs && invitation.guest.isTagAlong) return

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
    })

    return responses
  }
}
