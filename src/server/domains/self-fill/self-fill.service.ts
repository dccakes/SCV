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

import type { SelfFillRepository } from '~/server/domains/self-fill/self-fill.repository'
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
   * Get the current self-fill token for a wedding
   */
  async getToken(weddingId: string): Promise<string | null> {
    return this.selfFillRepo.getToken(weddingId)
  }
}
