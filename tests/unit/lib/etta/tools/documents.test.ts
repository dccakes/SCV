/**
 * @jest-environment node
 */

const mockExtractText = jest.fn()

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(() => ({ organizationId: 'org-1', role: 'owner' })),
}))

jest.mock('unpdf', () => ({
  extractText: (...args: unknown[]) => mockExtractText(...args),
}))

import { getDocumentTools } from '~/lib/etta/tools/documents'
import type { EttaContext } from '~/lib/etta/types'

type PromiseWithTry = PromiseConstructor & {
  try?: <T>(fn: () => T | PromiseLike<T>) => Promise<Awaited<T>>
}

const promiseWithTry = Promise as PromiseWithTry
const originalPromiseTry = promiseWithTry.try

const mockCtx: EttaContext = {
  weddingId: 'wedding-123',
  ettaActorId: 'actor-123',
  actor: 'couple',
  authz: {
    userId: 'user-123',
    activeOrganization: null,
  },
  wedding: {
    groomFirstName: 'John',
    groomLastName: 'Doe',
    brideFirstName: 'Jane',
    brideLastName: 'Smith',
  },
  guestCount: 50,
  eventCount: 2,
  vendorCount: 3,
  pendingSuggestionCount: 1,
  recentMemories: [],
}

const createHeaders = (contentType = 'application/pdf') =>
  new Headers({
    'content-type': contentType,
  })

describe('getDocumentTools', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    delete promiseWithTry.try
    global.fetch = jest.fn()
  })

  afterAll(() => {
    global.fetch = originalFetch
    if (originalPromiseTry) {
      promiseWithTry.try = originalPromiseTry
    } else {
      delete promiseWithTry.try
    }
  })

  const tools = getDocumentTools(mockCtx)

  describe('read_pdf', () => {
    it('installs Promise.try when missing and returns parsed PDF content', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: createHeaders(),
        arrayBuffer: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
      })
      mockExtractText.mockImplementation(async () => {
        return {
          text: 'Venue quote details',
          totalPages: 2,
        }
      })

      const result = await tools.read_pdf.execute(
        {
          fileUrl: 'https://files.example.com/proposal.pdf',
          fileName: 'proposal.pdf',
        },
        { toolCallId: 'tc1', messages: [], abortSignal: undefined as never }
      )

      expect(typeof promiseWithTry.try).toBe('function')
      expect(mockExtractText).toHaveBeenCalledWith(expect.any(Uint8Array), { mergePages: true })
      expect(result).toEqual({
        status: 'ok',
        fileName: 'proposal.pdf',
        totalPages: 2,
        totalCharacters: 19,
        truncated: false,
        content: 'Venue quote details',
      })
    })

    it('returns an HTTP fetch error without rejecting', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
      })

      const result = await tools.read_pdf.execute(
        { fileUrl: 'https://files.example.com/protected.pdf' },
        { toolCallId: 'tc2', messages: [], abortSignal: undefined as never }
      )

      expect(result).toEqual({
        status: 'fetch_error',
        error: 'Failed to fetch file: HTTP 403',
      })
      expect(mockExtractText).not.toHaveBeenCalled()
    })

    it('returns a parser error without rejecting when extractText throws', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: createHeaders(),
        arrayBuffer: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
      })
      mockExtractText.mockRejectedValue(new Error('Promise.try is not a function'))

      const result = await tools.read_pdf.execute(
        { fileUrl: 'https://files.example.com/proposal.pdf' },
        { toolCallId: 'tc3', messages: [], abortSignal: undefined as never }
      )

      expect(result).toEqual({
        status: 'parse_error',
        error: 'Failed to read PDF content',
        detail: 'read_failed',
      })
    })

    it('returns a note when the PDF has no extractable text', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: createHeaders(),
        arrayBuffer: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
      })
      mockExtractText.mockResolvedValue({
        text: '   ',
        totalPages: 1,
      })

      const result = await tools.read_pdf.execute(
        {
          fileUrl: 'https://files.example.com/scanned.pdf',
          fileName: 'scanned.pdf',
        },
        { toolCallId: 'tc4', messages: [], abortSignal: undefined as never }
      )

      expect(result).toEqual({
        status: 'no_text',
        fileName: 'scanned.pdf',
        totalPages: 1,
        totalCharacters: 3,
        truncated: false,
        content: '',
        note: 'No extractable text was found in this PDF. It may be scanned, image-only, or otherwise not text-readable.',
      })
    })

    it('preserves truncation behavior for long content', async () => {
      const longText = 'x'.repeat(12_500)

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: createHeaders(),
        arrayBuffer: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
      })
      mockExtractText.mockResolvedValue({
        text: longText,
        totalPages: 7,
      })

      const result = await tools.read_pdf.execute(
        { fileUrl: 'https://files.example.com/long.pdf' },
        { toolCallId: 'tc5', messages: [], abortSignal: undefined as never }
      )

      expect(result).toEqual({
        status: 'truncated',
        fileName: 'document.pdf',
        totalPages: 7,
        totalCharacters: 12_500,
        truncated: true,
        content: longText.slice(0, 12_000),
        note: 'Showing first 12,000 of 12,500 characters across 7 pages. Ask the user if they want to focus on a specific section.',
      })
    })

    it('requires planner authz', async () => {
      const toolsWithoutAuthz = getDocumentTools({ ...mockCtx, authz: undefined })

      await expect(
        toolsWithoutAuthz.read_pdf.execute(
          { fileUrl: 'https://files.example.com/proposal.pdf' },
          { toolCallId: 'tc6', messages: [], abortSignal: undefined as never }
        )
      ).rejects.toThrow('Authorization context required')
    })
  })
})
