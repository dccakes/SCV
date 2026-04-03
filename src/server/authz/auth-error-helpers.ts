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

export function isAccessError(error: unknown): boolean {
  return ACCESS_ERROR_CODES.has(getAuthErrorCode(error) ?? '')
}
