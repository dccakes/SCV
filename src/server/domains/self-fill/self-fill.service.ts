/**
 * Self-Fill Domain - Service
 *
 * Business logic for Self-Fill TOKEN MANAGEMENT only.
 * Handles generating, revoking, and retrieving self-fill tokens.
 *
 * Guest registration orchestration (cross-domain) lives in:
 *   ~/server/application/self-fill-registration/self-fill-registration.service.ts
 */

import { randomBytes } from 'node:crypto'

import { TOKEN_EXPIRY_DAYS, type SelfFillRepository } from '~/server/domains/self-fill/self-fill.repository'
import type { SelfFillWeddingData } from '~/server/domains/self-fill/self-fill.types'

export class SelfFillService {
  constructor(private selfFillRepo: SelfFillRepository) {}

  /**
   * Get wedding data by self-fill token (for public form display)
   */
  async getWeddingByToken(token: string): Promise<SelfFillWeddingData | null> {
    return this.selfFillRepo.findByToken(token)
  }

  /**
   * Generate a new self-fill token for a wedding.
   * Records the generation timestamp for future expiry checks.
   */
  async generateToken(weddingId: string): Promise<string> {
    const token = randomBytes(16).toString('hex')
    const generatedAt = new Date()
    await this.selfFillRepo.updateToken(weddingId, token, generatedAt)
    console.log(`[SelfFill] Token generated for weddingId=${weddingId}`, { generatedAt })
    return token
  }

  /**
   * Revoke (disable) the self-fill token for a wedding.
   * Sets both token and generatedAt to null.
   */
  async revokeToken(weddingId: string): Promise<void> {
    await this.selfFillRepo.updateToken(weddingId, null, null)
    console.log(`[SelfFill] Token revoked for weddingId=${weddingId}`, { revokedAt: new Date() })
  }

  /**
   * Get the current self-fill token for a wedding, along with its expiry date.
   * expiresAt is null for legacy tokens (generated before timestamp tracking was added).
   */
  async getToken(weddingId: string): Promise<{ token: string; expiresAt: Date | null } | null> {
    const result = await this.selfFillRepo.getToken(weddingId)
    if (!result) return null

    let expiresAt: Date | null = null
    if (result.generatedAt) {
      expiresAt = new Date(result.generatedAt)
      expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS)
    }

    return { token: result.token, expiresAt }
  }

  /**
   * Get the token, its expiry date, and the wedding's earliest event date in one call.
   * Keeps the router free of direct DB access for the expiry-warning feature.
   */
  async getTokenWithContext(weddingId: string): Promise<{
    token: string | null
    expiresAt: Date | null
    earliestEventDate: Date | null
  }> {
    const [tokenData, earliestEventDate] = await Promise.all([
      this.getToken(weddingId),
      this.selfFillRepo.getEarliestEventDate(weddingId),
    ])

    return {
      token: tokenData?.token ?? null,
      expiresAt: tokenData?.expiresAt ?? null,
      earliestEventDate,
    }
  }
}
