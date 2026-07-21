/**
 * Wedding Domain - Service
 *
 * Business logic for the Wedding domain.
 * Handles wedding creation, updates, and retrieval.
 */

import { TRPCError } from '@trpc/server'

import { provisionEtta } from '~/lib/etta/provision'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import { checklistSeedingService } from '~/server/domains/checklist'
import { emailService } from '~/server/domains/email'
import type { EventService } from '~/server/domains/event/event.service'
import type { GuestTagService } from '~/server/domains/guest-tag/guest-tag.service'
import type { WeddingRepository } from '~/server/domains/wedding/wedding.repository'
import type {
  CreateWeddingInput,
  UpdateWeddingInput,
  Wedding,
} from '~/server/domains/wedding/wedding.types'

/**
 * Default tags created for new weddings
 */
const DEFAULT_TAGS = [
  { name: 'Family', color: '#3b82f6' }, // blue
  { name: 'MutualFriends', color: '#10b981' }, // green
  { name: 'Coworkers', color: '#8b5cf6' }, // purple
  { name: 'Plus One', color: '#f59e0b' }, // amber
]

export class WeddingService {
  constructor(
    private weddingRepository: WeddingRepository,
    private eventService: EventService,
    private guestTagService: GuestTagService
  ) {}

  /**
   * Create a new wedding
   *
   * This creates:
   * 1. The wedding entity with couple's names
   * 2. A UserWedding join entry linking the user to the wedding
   * 3. A default "Wedding Day" event if date/location provided
   * 4. Updates the user's profile with couple info
   */
  async createWedding(userId: string, data: CreateWeddingInput): Promise<Wedding> {
    // Check if user already has a wedding (currently allow only one wedding per user)
    const existingWedding = await this.weddingRepository.existsForUser(userId)
    if (existingWedding) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User already has a wedding',
      })
    }

    const {
      groomFirstName,
      groomLastName,
      brideFirstName,
      brideLastName,
      weddingDate,
      weddingLocation,
    } = data

    // Create the wedding (repository will create UserWedding entry)
    const wedding = await this.weddingRepository.create({
      userId,
      groomFirstName,
      groomLastName,
      brideFirstName,
      brideLastName,
      enabledAddOns: ['tasks'],
    })

    // Seed default tags for the wedding
    await this.guestTagService.seedInitialTags(wedding.id, DEFAULT_TAGS)

    // Create default "Wedding Day" event if date/location provided
    if (data.hasWeddingDetails && (weddingDate || weddingLocation)) {
      await this.eventService.createEventSystem(wedding.id, {
        eventName: 'Ceremony',
        date: weddingDate ?? undefined,
        venue: weddingLocation ?? undefined,
        collectRsvp: false,
        allowTagAlongs: false,
      })

      try {
        await checklistSeedingService.ensureSeeded(wedding.id)
      } catch (error) {
        // biome-ignore lint/suspicious/noConsole: preserve successful wedding creation if checklist seeding fails post-commit
        console.error('[Checklist] Wedding create seeding failed:', error)
      }
    }

    // Provision Etta AI agent actor — fire-and-forget (idempotent)
    provisionEtta(wedding.id).catch(
      // biome-ignore lint/suspicious/noConsole: intentional error logging for fire-and-forget
      (err) => console.error('[Etta] Background provision failed:', err)
    )

    // Provision the wedding's inbound email address — fire-and-forget (idempotent)
    emailService.ensureInbox(wedding.id).catch(
      // biome-ignore lint/suspicious/noConsole: intentional error logging for fire-and-forget
      (err) => console.error('[Email] Background inbox provision failed:', err)
    )

    return wedding
  }

  /**
   * Update wedding settings
   */
  async updateWedding(input: {
    ctx: AuthzContext
    weddingId: string
    data: UpdateWeddingInput
  }): Promise<Wedding> {
    const { ctx, weddingId, data } = input
    requirePermission(ctx, { wedding: ['update'] })
    return this.weddingRepository.update(weddingId, data)
  }

  async toggleAddOn(input: {
    ctx: AuthzContext
    weddingId: string
    addOn: string
    enabled: boolean
  }): Promise<Wedding> {
    const { addOn, ctx, enabled, weddingId } = input
    requirePermission(ctx, { wedding: ['update'] })

    const wedding = await this.weddingRepository.findById(weddingId)
    if (!wedding) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wedding not found',
      })
    }

    const enabledAddOns = enabled
      ? Array.from(new Set([...wedding.enabledAddOns, addOn]))
      : wedding.enabledAddOns.filter((currentAddOn) => currentAddOn !== addOn)

    return this.weddingRepository.update(weddingId, {
      enabledAddOns,
    })
  }

  /**
   * Get wedding by user ID
   */
  async getByUserId(userId: string | null): Promise<Wedding | null> {
    if (!userId) {
      return null
    }
    return this.weddingRepository.findByUserId(userId)
  }

  async getScopedWeddingByUserId(
    _userId: string,
    sessionActiveOrganizationId: string | null
  ): Promise<Wedding> {
    if (!sessionActiveOrganizationId) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'No active organization in session',
      })
    }

    const scopedWedding = await this.weddingRepository.findByOrganizationId(
      sessionActiveOrganizationId
    )
    if (!scopedWedding) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Active organization is not linked to a wedding',
      })
    }

    return scopedWedding
  }

  /**
   * Get wedding by ID
   */
  async getById(weddingId: string): Promise<Wedding | null> {
    return this.weddingRepository.findById(weddingId)
  }

  /**
   * Check if user has a wedding
   */
  async hasWedding(userId: string): Promise<boolean> {
    return this.weddingRepository.existsForUser(userId)
  }

  /**
   * Get the wedding ID for a given user, throwing if not found.
   * Centralised helper used by domain routers to avoid duplication.
   */
  async getWeddingIdByUserId(
    userId: string,
    sessionActiveOrganizationId: string | null = null
  ): Promise<string> {
    const wedding = await this.getScopedWeddingByUserId(userId, sessionActiveOrganizationId)
    return wedding.id
  }
}
