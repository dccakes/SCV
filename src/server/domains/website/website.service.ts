/**
 * Website Domain - Service
 *
 * Business logic for the Website domain only.
 * Cross-domain orchestration lives in application services.
 */

import { TRPCError } from '@trpc/server'

import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { WebsiteRepository } from '~/server/domains/website/website.repository'
import type {
  PublicWebsite,
  UpdateWebsiteInput,
  Website,
  WebsiteWithComputedUrl,
} from '~/server/domains/website/website.types'
import { computeWebsiteUrl } from '~/server/domains/website/website.utils'
import { WebsitePasswordService } from '~/server/domains/website/website-password.service'
import { isKnownTemplateId } from '~/templates/catalog'

export class WebsiteService {
  constructor(
    private websiteRepository: WebsiteRepository,
    private websitePasswordService: WebsitePasswordService = new WebsitePasswordService()
  ) {}

  /**
   * Update website settings
   */
  async updateWebsite(
    ctx: AuthzContext,
    weddingId: string,
    data: UpdateWebsiteInput
  ): Promise<Website> {
    const updateRequiresContentPermission = data.subUrl !== undefined
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

    const password = data.password
      ? this.websitePasswordService.hashPassword(data.password)
      : undefined

    return this.websiteRepository.update(weddingId, {
      isPasswordEnabled: data.isPasswordEnabled,
      password,
      subUrl: data.subUrl,
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
   * Update the header/hero image
   */
  async updateHeaderImage(
    ctx: AuthzContext,
    weddingId: string,
    headerImageUrl: string | null
  ): Promise<Website> {
    this.requireWebsitePermission(ctx, 'update')
    return this.websiteRepository.updateHeaderImage(weddingId, headerImageUrl)
  }

  /**
   * Update the couple photo gallery
   */
  async updateCoupleImages(
    ctx: AuthzContext,
    weddingId: string,
    coupleImageUrls: string[]
  ): Promise<Website> {
    this.requireWebsitePermission(ctx, 'update')
    return this.websiteRepository.updateCoupleImages(weddingId, coupleImageUrls)
  }

  /**
   * Update the selected website template.
   *
   * The id is validated against the template registry at the edge (validator),
   * but we guard here too so the service is safe to call directly.
   */
  async updateTemplate(ctx: AuthzContext, weddingId: string, templateId: string): Promise<Website> {
    this.requireWebsitePermission(ctx, 'update')

    if (!isKnownTemplateId(templateId)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Unknown wedding website template',
      })
    }

    return this.websiteRepository.updateTemplate(weddingId, templateId)
  }

  /**
   * Get website by wedding ID
   */
  async getByWeddingId(weddingId: string | null): Promise<WebsiteWithComputedUrl | null> {
    if (!weddingId) {
      return null
    }
    const website = await this.websiteRepository.findByWeddingId(weddingId)
    if (!website) {
      return null
    }
    return this.attachComputedUrl(website)
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

  private toPublicWebsite(website: Website): PublicWebsite {
    const { password: _password, ...publicWebsite } = website
    return {
      ...publicWebsite,
      url: computeWebsiteUrl(website.subUrl),
    }
  }

  private attachComputedUrl(website: Website): WebsiteWithComputedUrl {
    return {
      ...website,
      url: computeWebsiteUrl(website.subUrl),
    }
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
