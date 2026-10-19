import {
  ConflictError,
  DomainError,
  ForbiddenError,
  InvariantViolationError,
  NotFoundError,
  PreconditionFailedError,
  ValidationError,
} from '~/server/domains/shared/domain-error'

describe('DomainError', () => {
  it.each([
    [NotFoundError, 'NOT_FOUND'],
    [ForbiddenError, 'FORBIDDEN'],
    [ConflictError, 'CONFLICT'],
    [ValidationError, 'VALIDATION'],
    [PreconditionFailedError, 'PRECONDITION_FAILED'],
    [InvariantViolationError, 'INVARIANT_VIOLATION'],
  ] as const)('%p exposes kind %s', (ErrorClass, kind) => {
    const error = new ErrorClass('boom')

    expect(error).toBeInstanceOf(DomainError)
    expect(error).toBeInstanceOf(Error)
    expect(error.kind).toBe(kind)
    expect(error.message).toBe('boom')
    expect(error.name).toBe(ErrorClass.name)
  })

  it('keeps the cause', () => {
    const cause = new Error('root')
    const error = new NotFoundError('missing', { cause })

    expect(error.cause).toBe(cause)
  })

  it('falls back to the kind as message when none is given', () => {
    const error = new ValidationError()

    expect(error.message).toBe('VALIDATION')
    expect(error.hasMessage).toBe(false)
    expect(new ValidationError('bad').hasMessage).toBe(true)
  })
})
