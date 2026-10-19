import { PreconditionFailedError } from '~/server/domains/shared/domain-error'

export const requireActiveWeddingId = (weddingId: string | null): string => {
  if (!weddingId) {
    throw new PreconditionFailedError('No active wedding found for the current workspace.')
  }

  return weddingId
}
