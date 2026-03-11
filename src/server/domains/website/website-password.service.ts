import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const PASSWORD_KEY_LENGTH = 64
const DEFAULT_SIGNING_SECRET = process.env.BETTER_AUTH_SECRET ?? 'website-password-secret'

export class WebsitePasswordService {
  constructor(private signingSecret: string = DEFAULT_SIGNING_SECRET) {}

  hashPassword(rawPassword: string): string {
    const salt = randomBytes(16).toString('hex')
    const derivedKey = scryptSync(rawPassword, salt, PASSWORD_KEY_LENGTH).toString('hex')
    return `${salt}:${derivedKey}`
  }

  verifyPassword(rawPassword: string, storedPasswordHash: string | null): boolean {
    if (!storedPasswordHash) return false

    const [salt, storedDerivedKey] = storedPasswordHash.split(':')
    if (!salt || !storedDerivedKey) return false

    const inputDerivedKey = scryptSync(rawPassword, salt, PASSWORD_KEY_LENGTH)
    const storedDerivedKeyBuffer = Buffer.from(storedDerivedKey, 'hex')

    if (inputDerivedKey.length !== storedDerivedKeyBuffer.length) {
      return false
    }

    return timingSafeEqual(inputDerivedKey, storedDerivedKeyBuffer)
  }

  createAccessToken(websiteId: string, passwordHash: string): string {
    return createHmac('sha256', this.signingSecret)
      .update(`${websiteId}:${passwordHash}`)
      .digest('hex')
  }

  verifyAccessToken(
    token: string | undefined,
    websiteId: string,
    passwordHash: string | null
  ): boolean {
    if (!token || !passwordHash) return false

    const expectedToken = this.createAccessToken(websiteId, passwordHash)
    const inputBuffer = Buffer.from(token)
    const expectedBuffer = Buffer.from(expectedToken)

    if (inputBuffer.length !== expectedBuffer.length) {
      return false
    }

    return timingSafeEqual(inputBuffer, expectedBuffer)
  }
}
