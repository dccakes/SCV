import {
  ALLOWED_CONTENT_TYPES,
  BLOB_URL_PATTERN,
  DROPZONE_ACCEPT,
  sanitizeFilename,
} from '~/lib/upload-config'

describe('upload-config', () => {
  describe('sanitizeFilename', () => {
    it('should strip path traversal sequences', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd')
    })

    it('should strip path separators', () => {
      expect(sanitizeFilename('path/to\\file.pdf')).toBe('pathtofile.pdf')
    })

    it('should strip control characters', () => {
      expect(sanitizeFilename('file\x00name\x1f.pdf')).toBe('filename.pdf')
    })

    it('should trim whitespace', () => {
      expect(sanitizeFilename('  file.pdf  ')).toBe('file.pdf')
    })

    it('should pass through clean filenames unchanged', () => {
      expect(sanitizeFilename('proposal.pdf')).toBe('proposal.pdf')
    })
  })

  describe('BLOB_URL_PATTERN', () => {
    it('should match valid Vercel Blob URLs', () => {
      expect(BLOB_URL_PATTERN.test('https://abc123.public.blob.vercel-storage.com/file.pdf')).toBe(true)
    })

    it('should reject non-Vercel URLs', () => {
      expect(BLOB_URL_PATTERN.test('https://evil.com/file.pdf')).toBe(false)
    })
  })

  describe('consistency', () => {
    it('client-side DROPZONE_ACCEPT keys should be a subset of ALLOWED_CONTENT_TYPES', () => {
      const allowedSet = new Set(ALLOWED_CONTENT_TYPES)
      for (const mimeType of Object.keys(DROPZONE_ACCEPT)) {
        expect(allowedSet.has(mimeType)).toBe(true)
      }
    })

    it('ALLOWED_CONTENT_TYPES should have a corresponding DROPZONE_ACCEPT entry', () => {
      const acceptKeys = new Set(Object.keys(DROPZONE_ACCEPT))
      for (const mimeType of ALLOWED_CONTENT_TYPES) {
        expect(acceptKeys.has(mimeType)).toBe(true)
      }
    })
  })
})
