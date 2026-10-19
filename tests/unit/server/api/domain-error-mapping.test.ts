import { TRPCError } from '@trpc/server'

import { toTRPCError } from '~/server/api/domain-error-mapping'
import {
  ConflictError,
  ForbiddenError,
  InvariantViolationError,
  NotFoundError,
  PreconditionFailedError,
  ValidationError,
} from '~/server/domains/shared/domain-error'

describe('toTRPCError', () => {
  it.each([
    [new NotFoundError('x'), 'NOT_FOUND'],
    [new ForbiddenError('x'), 'FORBIDDEN'],
    [new ConflictError('x'), 'CONFLICT'],
    [new ValidationError('x'), 'BAD_REQUEST'],
    [new PreconditionFailedError('x'), 'PRECONDITION_FAILED'],
    [new InvariantViolationError('x'), 'INTERNAL_SERVER_ERROR'],
  ] as const)('maps %p to %s', (domainError, code) => {
    const mapped = toTRPCError(domainError)

    expect(mapped).toBeInstanceOf(TRPCError)
    expect(mapped.code).toBe(code)
    expect(mapped.message).toBe('x')
    expect(mapped.cause).toBe(domainError)
  })

  it('uses the code as message when the domain error has none, matching TRPCError', () => {
    expect(toTRPCError(new ForbiddenError()).message).toBe(
      new TRPCError({ code: 'FORBIDDEN' }).message
    )
    expect(toTRPCError(new ValidationError()).message).toBe('BAD_REQUEST')
  })
})
