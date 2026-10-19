import { DomainError } from '~/server/domains/shared/domain-error'

export const ACCESS_ERROR_CODES = new Set([
  'FORBIDDEN',
  'UNAUTHORIZED',
  'PRECONDITION_FAILED',
  'NOT_FOUND',
])

export function getAuthErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') {
    return null
  }

  const candidate = (error as { code?: unknown }).code
  return typeof candidate === 'string' ? candidate : null
}

const ACCESS_ERROR_KINDS = new Set<DomainError['kind']>([
  'FORBIDDEN',
  'PRECONDITION_FAILED',
  'NOT_FOUND',
])

/** True for access failures from tRPC callers (`code`) and direct service calls (`DomainError`). */
export function isAccessError(error: unknown): boolean {
  if (error instanceof DomainError) {
    return ACCESS_ERROR_KINDS.has(error.kind)
  }
  return ACCESS_ERROR_CODES.has(getAuthErrorCode(error) ?? '')
}
