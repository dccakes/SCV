/**
 * Shared Kernel - Domain Errors
 *
 * Transport-agnostic business rule failures. Domain and application code throw
 * these; the tRPC layer maps them to TRPCError codes in one place
 * (`~/server/api/domain-error-mapping`). Server actions and pages that call
 * services directly branch on the subclasses.
 */

export type DomainErrorKind =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'PRECONDITION_FAILED'
  | 'INVARIANT_VIOLATION'

type DomainErrorOptions = { cause?: unknown }

export abstract class DomainError extends Error {
  /** False when no message was given and `message` fell back to the kind. */
  readonly hasMessage: boolean

  protected constructor(
    readonly kind: DomainErrorKind,
    message?: string,
    options?: DomainErrorOptions
  ) {
    // Fall back to the kind so logs and Etta tool output stay readable.
    super(message || kind, options)
    this.name = new.target.name
    this.hasMessage = Boolean(message)
  }
}

/** The requested resource does not exist (or is not visible to the caller). */
export class NotFoundError extends DomainError {
  constructor(message?: string, options?: DomainErrorOptions) {
    super('NOT_FOUND', message, options)
  }
}

/** The caller may not perform this action or touch this resource. */
export class ForbiddenError extends DomainError {
  constructor(message?: string, options?: DomainErrorOptions) {
    super('FORBIDDEN', message, options)
  }
}

/** The action conflicts with existing state (duplicates, stale writes). */
export class ConflictError extends DomainError {
  constructor(message?: string, options?: DomainErrorOptions) {
    super('CONFLICT', message, options)
  }
}

/** The input breaks a business rule. */
export class ValidationError extends DomainError {
  constructor(message?: string, options?: DomainErrorOptions) {
    super('VALIDATION', message, options)
  }
}

/** Required context is missing (no active wedding, add-on disabled, ...). */
export class PreconditionFailedError extends DomainError {
  constructor(message?: string, options?: DomainErrorOptions) {
    super('PRECONDITION_FAILED', message, options)
  }
}

/** Something that should never happen did: a broken internal invariant. */
export class InvariantViolationError extends DomainError {
  constructor(message?: string, options?: DomainErrorOptions) {
    super('INVARIANT_VIOLATION', message, options)
  }
}
