/**
 * The user-facing text of a rate limited response. Shared by the server (which sends it) and the
 * Etta chat (which recognises it), so rewording it cannot silently break that recognition.
 */
export const TOO_MANY_REQUESTS_MESSAGE = 'Too many requests. Please try again later.'
