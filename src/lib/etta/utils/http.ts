import { TRPCError } from '@trpc/server'
import { EttaAuthError } from '~/lib/etta/utils/auth'

export function inferEttaHttpStatus(error: unknown, message: string): number {
  if (error instanceof EttaAuthError) {
    return error.status
  }

  if (error instanceof TRPCError) {
    switch (error.code) {
      case 'FORBIDDEN':
        return 403
      case 'PRECONDITION_FAILED':
        return 412
      case 'NOT_FOUND':
        return 404
      case 'UNAUTHORIZED':
        return 401
      default:
        return 500
    }
  }

  if (message === 'No active session' || message.startsWith('Invalid guest token:')) {
    return 401
  }
  if (message === 'No active wedding in workspace scope') {
    return 412
  }
  if (message === 'No wedding found for user') {
    return 404
  }
  if (message.startsWith('Etta is not configured:')) {
    return 503
  }

  return 500
}
