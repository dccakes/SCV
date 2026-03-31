/**
 * Shared upload configuration
 *
 * Single source of truth for file upload constraints used by both
 * client-side dropzone validation and server-side upload handling.
 */

/** Maximum file size in bytes (8 MB) */
export const MAX_FILE_SIZE = 8 * 1024 * 1024

/** Maximum number of files per quote */
export const MAX_FILES_PER_QUOTE = 10

/** MIME types allowed for upload */
export const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const

/** Dropzone `accept` map — keys are MIME types, values are file extensions */
export const DROPZONE_ACCEPT: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'text/plain': ['.txt'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
}

/** Human-readable list of accepted file types for display in the UI */
export const ACCEPTED_TYPES_LABEL = 'PDF, images, Word, Excel, or text files'

/** Vercel Blob storage URL pattern for validating file URLs */
export const BLOB_URL_PATTERN = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//

/**
 * Sanitize a filename by removing path traversal sequences and
 * replacing characters that are unsafe for storage keys.
 */
export function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/\.\./g, '') // strip path traversal
      .replace(/[/\\]/g, '') // strip path separators
      // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally strips ASCII control characters
      .replace(/[\u0000-\u001f]/g, '') // strip control characters
      .trim()
  )
}
