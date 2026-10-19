import { TRPCError } from '@trpc/server'

import type { DomainError, DomainErrorKind } from '~/server/domains/shared/domain-error'

type TRPCErrorCode = ConstructorParameters<typeof TRPCError>[0]['code']

const CODE_BY_KIND: Record<DomainErrorKind, TRPCErrorCode> = {
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  VALIDATION: 'BAD_REQUEST',
  PRECONDITION_FAILED: 'PRECONDITION_FAILED',
  INVARIANT_VIOLATION: 'INTERNAL_SERVER_ERROR',
}

/**
 * Translate a domain error into the tRPC error clients see. An empty domain
 * message becomes the code string, matching what `new TRPCError({ code })`
 * produced before services threw domain errors.
 */
export function toTRPCError(error: DomainError): TRPCError {
  const code = CODE_BY_KIND[error.kind]
  return new TRPCError({ code, message: error.hasMessage ? error.message : code, cause: error })
}
