import { TRPCError } from '@trpc/server'

import { isAccessError } from '~/server/authz/auth-error-helpers'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PreconditionFailedError,
  ValidationError,
} from '~/server/domains/shared/domain-error'

describe('isAccessError', () => {
  it.each([
    'FORBIDDEN',
    'UNAUTHORIZED',
    'PRECONDITION_FAILED',
    'NOT_FOUND',
  ] as const)('recognises a %s TRPCError from tRPC callers', (code) => {
    expect(isAccessError(new TRPCError({ code }))).toBe(true)
  })

  it.each([
    new ForbiddenError(),
    new PreconditionFailedError('no wedding'),
    new NotFoundError('gone'),
  ])('recognises %p thrown by a directly called service', (error) => {
    expect(isAccessError(error)).toBe(true)
  })

  it.each([
    new ValidationError('bad'),
    new ConflictError('dup'),
    new TRPCError({ code: 'BAD_REQUEST' }),
    new Error('boom'),
    null,
  ])('ignores %p', (error) => {
    expect(isAccessError(error)).toBe(false)
  })
})
