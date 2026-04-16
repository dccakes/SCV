/**
 * Website Domain - Service
 *
 * Business logic for the Website domain only.
 * Cross-domain orchestration lives in application services.
 */

// biome-ignore lint/style/noRestrictedImports: architectural violation, tracked in ARCHITECTURAL_VIOLATIONS.md
import type { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import { TRPCError } from '@trpc/server'

import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { WebsiteRepository } from '~/server/domains/website/website.repository'
import type {
  PublicWebsite,
  UpdateWebsiteInput,
  Website,
} from '~/server/domains/website/website.types'
import { WebsitePasswordService } from '~/server/domains/website/website-password.service'

export class WebsiteService {
  constructor(
    private websiteRepository: WebsiteRepository,
    private websitePasswordService: WebsitePasswordService = new WebsitePasswordService(),
    private db?: PrismaClient
  ) {}

  /**
   * Update website settings
   */
  async updateWebsite(
    ctx: AuthzContext,
    weddingId: string,
    data: UpdateWebsiteInput
  ): Promise<Website> {
    const updateRequiresContentPermission = data.subUrl !== undefined || data.basePath !== undefined
    const updateRequiresPasswordPermission =
      data.password !== undefined || data.isPasswordEnabled !== undefined

    if (!updateRequiresContentPermission && !updateRequiresPasswordPermission) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'At least one website setting must be provided',
      })
    }

    if (updateRequiresContentPermission) {
      this.requireWebsitePermission(ctx, 'update')
    }

    if (updateRequiresPasswordPermission) {
      this.requireWebsitePermission(ctx, 'password_update')
    }

    const url = data.subUrl !== undefined ? `${data.basePath}/${data.subUrl}` : undefined
    const password = data.password
      ? this.websitePasswordService.hashPassword(data.password)
      : undefined

    return this.websiteRepository.update(weddingId, {
      isPasswordEnabled: data.isPasswordEnabled,
      password,
      subUrl: data.subUrl,
      url,
    })
  }

  /**
   * Update RSVP enabled status
   */
  async updateRsvpEnabled(
    ctx: AuthzContext,
    weddingId: string,
    websiteId: string,
    isRsvpEnabled: boolean
  ): Promise<Website> {
    this.requireWebsitePermission(ctx, 'publish')

    const belongsToWedding = await this.websiteRepository.belongsToWedding(websiteId, weddingId)
    if (!belongsToWedding) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to modify this website',
      })
    }

    return this.websiteRepository.updateRsvpEnabled(websiteId, isRsvpEnabled)
  }

  /**
   * Update cover photo
   */
  async updateCoverPhoto(
    ctx: AuthzContext,
    weddingId: string,
    coverPhotoUrl: string | null
  ): Promise<Website> {
    this.requireWebsitePermission(ctx, 'update')
    return this.websiteRepository.updateCoverPhoto(weddingId, coverPhotoUrl)
  }

  /**
   * Get website by wedding ID
   */
  async getByWeddingId(weddingId: string | null): Promise<Website | null> {
    if (!weddingId) {
      return null
    }
    return this.websiteRepository.findByWeddingId(weddingId)
  }

  /**
   * Get website by sub URL
   */
  async getBySubUrl(subUrl: string | null | undefined): Promise<PublicWebsite | null> {
    if (!subUrl) {
      return null
    }
    const website = await this.websiteRepository.findBySubUrl(subUrl)
    if (!website) {
      return null
    }

    return this.toPublicWebsite(website)
  }

  async hasPasswordAccess(subUrl: string, accessToken: string | undefined): Promise<boolean> {
    const website = await this.websiteRepository.findBySubUrl(subUrl)
    if (!website) {
      return false
    }

    if (!website.isPasswordEnabled) {
      return true
    }

    return this.websitePasswordService.verifyAccessToken(accessToken, website.id, website.password)
  }

  async verifyWebsitePassword(subUrl: string, inputPassword: string): Promise<string | null> {
    const website = await this.websiteRepository.findBySubUrl(subUrl)

    if (!website?.isPasswordEnabled) {
      return null
    }

    const isValidPassword = this.websitePasswordService.verifyPassword(
      inputPassword,
      website.password
    )
    if (!isValidPassword) {
      return null
    }

    if (!website.password) {
      return null
    }

    return this.websitePasswordService.createAccessToken(website.id, website.password)
  }

  /**
   * Look up households by guest name — public, returns no email addresses
   */
  async lookupHouseholdByName(subUrl: string, name: string) {
    if (!this.db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB not available' })
    const website = await this.websiteRepository.findBySubUrl(subUrl)
    if (!website) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Wedding website not found' })
    }

    const households = await this.db.household.findMany({
      where: {
        weddingId: website.weddingId,
        OR: [
          {
            guests: {
              some: {
                firstName: { contains: name, mode: 'insensitive' },
                invitations: { some: { rsvp: { in: ['Invited', 'Attending', 'Declined'] } } },
              },
            },
          },
          {
            guests: {
              some: {
                lastName: { contains: name, mode: 'insensitive' },
                invitations: { some: { rsvp: { in: ['Invited', 'Attending', 'Declined'] } } },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        guests: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isPrimaryContact: true,
            isTagAlong: true,
            invitations: {
              select: { eventId: true, rsvp: true },
            },
          },
        },
      },
    })

    return households.map((h) => {
      const primaryContact = h.guests.find((g) => g.isPrimaryContact)
      return {
        id: h.id,
        primaryContactHasEmail: !!primaryContact?.email,
        guests: h.guests.map(({ email: _email, ...g }) => g),
      }
    })
  }

  /**
   * Validate a household RSVP token and return household data
   */
  async validateRsvpToken(subUrl: string, rsvpToken: string) {
    if (!this.db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB not available' })
    const household = await this.db.household.findFirst({
      where: {
        rsvpToken,
        wedding: { website: { subUrl } },
      },
      select: {
        id: true,
        guests: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isPrimaryContact: true,
            isTagAlong: true,
            invitations: { select: { eventId: true, rsvp: true } },
          },
        },
      },
    })

    if (!household) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Invalid RSVP token' })
    }

    return {
      rsvpToken,
      household: { id: household.id, guests: household.guests },
    }
  }

  /**
   * Confirm household identity by name + email; returns rsvpToken on match
   */
  async confirmHouseholdIdentity(subUrl: string, householdId: string, email: string) {
    if (!this.db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB not available' })
    const household = await this.db.household.findFirst({
      where: {
        id: householdId,
        wedding: { website: { subUrl } },
      },
      select: {
        id: true,
        rsvpToken: true,
        guests: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isPrimaryContact: true,
            isTagAlong: true,
            invitations: { select: { eventId: true, rsvp: true } },
          },
        },
      },
    })

    if (!household) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Household not found' })
    }

    const primaryContact = household.guests.find((g) => g.isPrimaryContact)
    if (!primaryContact?.email) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message:
          'No email on file. Please contact the couple to receive your personal RSVP link.',
      })
    }

    if (primaryContact.email.toLowerCase() !== email.toLowerCase().trim()) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Email does not match our records. Please try again.',
      })
    }

    let { rsvpToken } = household
    if (!rsvpToken) {
      rsvpToken = randomUUID()
      await this.db.household.update({ where: { id: householdId }, data: { rsvpToken } })
    }

    return {
      rsvpToken,
      household: { id: household.id, guests: household.guests },
    }
  }

  /**
   * Update primary contact's email/phone — scoped by rsvpToken
   */
  async updateGuestContactInfo(
    subUrl: string,
    rsvpToken: string,
    data: { email?: string; phone?: string }
  ) {
    if (!this.db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB not available' })
    const household = await this.db.household.findFirst({
      where: {
        rsvpToken,
        wedding: { website: { subUrl } },
      },
      select: {
        guests: {
          where: { isPrimaryContact: true },
          select: { id: true },
        },
      },
    })

    if (!household) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Invalid RSVP token' })
    }

    const primaryContact = household.guests[0]
    if (!primaryContact) {
      return { success: false }
    }

    await this.db.guest.update({
      where: { id: primaryContact.id },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    })

    return { success: true }
  }

  private toPublicWebsite(website: Website): PublicWebsite {
    const { password: _password, ...publicWebsite } = website
    return publicWebsite
  }

  private requireWebsitePermission(
    ctx: AuthzContext,
    action: 'read' | 'update' | 'publish' | 'password_update'
  ): void {
    requirePermission(ctx, {
      website: [action],
    })
  }
}
