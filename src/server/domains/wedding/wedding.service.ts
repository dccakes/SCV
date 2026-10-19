/**
 * Wedding Domain - Service
 *
 * Business logic for the Wedding domain.
 * Handles wedding creation, updates, and retrieval.
 */

import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import {
  NotFoundError,
  PreconditionFailedError,
  ValidationError,
} from '~/server/domains/shared/domain-error'
import type { WeddingRepository } from '~/server/domains/wedding/wedding.repository'
import type {
  CreateWeddingInput,
  UpdateWeddingInput,
  Wedding,
} from '~/server/domains/wedding/wedding.types'

export class WeddingService {
  constructor(private weddingRepository: WeddingRepository) {}

  /**
   * Create a new wedding entity (and its UserWedding join entry).
   *
   * Only one wedding per user is allowed. Seeding tags, the default event,
   * the checklist and Etta is onboarding orchestration and lives in
   * WeddingProvisioningService.
   */
  async createWedding(userId: string, data: CreateWeddingInput): Promise<Wedding> {
    const existingWedding = await this.weddingRepository.existsForUser(userId)
    if (existingWedding) {
      throw new ValidationError('User already has a wedding')
    }

    const { groomFirstName, groomLastName, brideFirstName, brideLastName } = data

    // Repository also creates the UserWedding entry
    return this.weddingRepository.create({
      userId,
      groomFirstName,
      groomLastName,
      brideFirstName,
      brideLastName,
      enabledAddOns: ['tasks'],
    })
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
      throw new NotFoundError('Wedding not found')
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
      throw new PreconditionFailedError('No active organization in session')
    }

    const scopedWedding = await this.weddingRepository.findByOrganizationId(
      sessionActiveOrganizationId
    )
    if (!scopedWedding) {
      throw new PreconditionFailedError('Active organization is not linked to a wedding')
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
