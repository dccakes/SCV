/**
 * Jest stand-in for `better-auth/api`, which ships ESM only and can't be parsed by Jest.
 * Mapped in jest.config.ts, so any module that imports it (e.g. src/lib/auth.ts through the
 * invitation privacy plugin) loads without a per-test mock. Tests that need to drive the
 * helpers import them from 'better-auth/api' and set up return values themselves.
 */

export class APIError extends Error {
  constructor(
    public status: string,
    public body?: { message?: string }
  ) {
    super(body?.message ?? status)
  }
}

// Handlers are used as plain functions in tests.
export const createAuthMiddleware = <T>(handler: T): T => handler

export const getSessionFromCtx = jest.fn()
