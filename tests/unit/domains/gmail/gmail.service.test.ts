/**
 * Tests for Gmail Domain Service
 */

import { TRPCError } from '@trpc/server'

jest.mock('~/server/domains/gmail/gmail.repository')
jest.mock('~/env', () => ({
  env: {
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    PORT: '3000',
  },
}))

// Shared mock fns object — populated inside jest.mock factory and exported
// via the module so tests can access them after mock initialisation.
jest.mock('googleapis', () => {
  const fns = {
    generateAuthUrl: jest.fn(),
    getToken: jest.fn(),
    setCredentials: jest.fn(),
    revokeToken: jest.fn(),
    refreshAccessToken: jest.fn(),
    userinfoGet: jest.fn(),
    messagesGet: jest.fn(),
    messagesList: jest.fn(),
    draftsCreate: jest.fn(),
  }
  return {
    __mockFns: fns,
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(() => ({
          generateAuthUrl: fns.generateAuthUrl,
          getToken: fns.getToken,
          setCredentials: fns.setCredentials,
          revokeToken: fns.revokeToken,
          refreshAccessToken: fns.refreshAccessToken,
        })),
      },
      oauth2: jest.fn().mockReturnValue({ userinfo: { get: fns.userinfoGet } }),
      gmail: jest.fn().mockReturnValue({
        users: {
          messages: { list: fns.messagesList, get: fns.messagesGet },
          drafts: { create: fns.draftsCreate },
        },
      }),
    },
  }
})

// Access the google mock fns after mock initialisation
const { __mockFns: gm } = jest.requireMock('googleapis') as {
  __mockFns: Record<string, jest.Mock>
}

// @ts-expect-error - Importing mock functions from mocked module
import {
  mockConnection, mockStoredMessage,
  mockFindConnectionByUserId, mockUpsertConnection, mockDeleteConnection,
  mockUpsertSyncState, mockUpsertMessage,
  mockFindMessagesByWedding, mockFindMessagesByThread,
  mockGetVendorEmailMap, mockFindWeddingIdByUserId,
  resetMocks, GmailRepository,
} from '~/server/domains/gmail/gmail.repository'
import { GmailService } from '~/server/domains/gmail/gmail.service'

const mConn = mockFindConnectionByUserId as jest.Mock
const mUpsertConn = mockUpsertConnection as jest.Mock
const mDelConn = mockDeleteConnection as jest.Mock
const mSyncState = mockUpsertSyncState as jest.Mock
const mUpsertMsg = mockUpsertMessage as jest.Mock
const mMsgByWedding = mockFindMessagesByWedding as jest.Mock
const mMsgByThread = mockFindMessagesByThread as jest.Mock
const mVendorEmails = mockGetVendorEmailMap as jest.Mock
const mWedding = mockFindWeddingIdByUserId as jest.Mock

describe('GmailService', () => {
  let svc: GmailService

  beforeEach(() => {
    resetMocks()
    for (const fn of Object.values(gm)) fn.mockReset()
    svc = new GmailService(new GmailRepository({}))
  })

  describe('getConnection', () => {
    it('returns connected when connection exists', async () => {
      mConn.mockResolvedValue(mockConnection)
      expect(await svc.getConnection('u1')).toEqual({ connected: true, email: 'user@example.com' })
    })
    it('returns not connected when no connection', async () => {
      mConn.mockResolvedValue(null)
      expect(await svc.getConnection('u1')).toEqual({ connected: false, email: null })
    })
  })

  describe('getAuthUrl', () => {
    it('generates URL with correct scopes', () => {
      gm.generateAuthUrl!.mockReturnValue('https://accounts.google.com/auth')
      expect(svc.getAuthUrl('u1')).toBe('https://accounts.google.com/auth')
      expect(gm.generateAuthUrl).toHaveBeenCalledWith(expect.objectContaining({ access_type: 'offline', prompt: 'consent' }))
    })
    it('throws when Google credentials not configured', () => {
      const envMod = jest.requireMock('~/env') as { env: Record<string, string | undefined> }
      const orig = { id: envMod.env.GOOGLE_CLIENT_ID, secret: envMod.env.GOOGLE_CLIENT_SECRET }
      envMod.env.GOOGLE_CLIENT_ID = undefined
      envMod.env.GOOGLE_CLIENT_SECRET = undefined
      try { expect(() => svc.getAuthUrl('u1')).toThrow(TRPCError) }
      finally { envMod.env.GOOGLE_CLIENT_ID = orig.id; envMod.env.GOOGLE_CLIENT_SECRET = orig.secret }
    })
  })

  describe('disconnect', () => {
    it('revokes token and deletes connection', async () => {
      mConn.mockResolvedValue(mockConnection); mDelConn.mockResolvedValue(undefined)
      await svc.disconnect('u1')
      expect(gm.revokeToken).toHaveBeenCalledWith('access-token-123')
      expect(mDelConn).toHaveBeenCalledWith('u1')
    })
    it('throws NOT_FOUND when no connection', async () => {
      mConn.mockResolvedValue(null)
      await expect(svc.disconnect('u1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
    it('still deletes if revocation fails', async () => {
      mConn.mockResolvedValue(mockConnection); gm.revokeToken!.mockRejectedValue(new Error('fail'))
      mDelConn.mockResolvedValue(undefined)
      await svc.disconnect('u1')
      expect(mDelConn).toHaveBeenCalledWith('u1')
    })
  })

  describe('listMessages', () => {
    it('returns messages from local storage', async () => {
      mWedding.mockResolvedValue('w1'); mMsgByWedding.mockResolvedValue({ messages: [mockStoredMessage], total: 1 })
      expect((await svc.listMessages('u1', { limit: 20, offset: 0 })).messages).toHaveLength(1)
    })
    it('throws NOT_FOUND when no wedding', async () => {
      mWedding.mockResolvedValue(null)
      await expect(svc.listMessages('u1', { limit: 20, offset: 0 })).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })

  describe('getThread', () => {
    it('returns thread with messages', async () => {
      mWedding.mockResolvedValue('wedding-123'); mMsgByThread.mockResolvedValue([mockStoredMessage])
      const r = await svc.getThread('u1', 'gmail-thread-abc')
      expect(r.threadId).toBe('gmail-thread-abc'); expect(r.vendorName).toBe('Alice Photos')
    })
    it('throws NOT_FOUND when empty', async () => {
      mWedding.mockResolvedValue('w1'); mMsgByThread.mockResolvedValue([])
      await expect(svc.getThread('u1', 'x')).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
    it('throws FORBIDDEN when thread belongs to different wedding', async () => {
      mWedding.mockResolvedValue('OTHER'); mMsgByThread.mockResolvedValue([mockStoredMessage])
      await expect(svc.getThread('u1', 'gmail-thread-abc')).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })

  describe('createDraft', () => {
    const input = { threadId: 't1', to: 'v@example.com', subject: 'Re: Hi', body: 'Hello' }
    beforeEach(() => {
      mConn.mockResolvedValue(mockConnection)
      gm.refreshAccessToken!.mockResolvedValue({ credentials: { access_token: 'new', expiry_date: Date.now() + 3600000 } })
    })
    it('creates draft with correct format', async () => {
      gm.draftsCreate!.mockResolvedValue({ data: { id: 'd1' } })
      expect(await svc.createDraft('u1', input)).toBe('d1')
      const raw = gm.draftsCreate!.mock.calls[0]![0].requestBody.message.raw as string
      expect(Buffer.from(raw, 'base64url').toString('utf-8')).toContain('To: v@example.com')
    })
    it('throws when draft.data.id is null', async () => {
      gm.draftsCreate!.mockResolvedValue({ data: { id: null } })
      await expect(svc.createDraft('u1', input)).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' })
    })
  })

  describe('syncAllVendorEmails', () => {
    it('returns zero when no vendor emails', async () => {
      mConn.mockResolvedValue(mockConnection); mWedding.mockResolvedValue('w1'); mVendorEmails.mockResolvedValue(new Map())
      expect(await svc.syncAllVendorEmails('u1')).toEqual({ synced: 0, skipped: 0 })
    })
    it('throws when Gmail not connected', async () => {
      mConn.mockResolvedValue(null)
      await expect(svc.syncAllVendorEmails('u1')).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' })
    })
    it('syncs messages matching vendor emails', async () => {
      mConn.mockResolvedValue(mockConnection); mWedding.mockResolvedValue('w1')
      mVendorEmails.mockResolvedValue(new Map([['alice@photos.com', 'v1']]))
      gm.refreshAccessToken!.mockResolvedValue({ credentials: { access_token: 'new', expiry_date: Date.now() + 3600000 } })
      gm.messagesList!.mockResolvedValue({ data: { messages: [{ id: 'm1' }] } })
      gm.messagesGet!.mockResolvedValue({
        data: { id: 'm1', threadId: 't1', snippet: 'Hi', labelIds: [],
          payload: { headers: [
            { name: 'From', value: 'Alice <alice@photos.com>' }, { name: 'To', value: 'user@example.com' },
            { name: 'Subject', value: 'Quote' }, { name: 'Date', value: 'Wed, 01 Jan 2026 12:00:00 +0000' },
          ], body: { data: Buffer.from('body').toString('base64url') } } },
      })
      mUpsertMsg.mockResolvedValue(undefined); mSyncState.mockResolvedValue(undefined)
      const r = await svc.syncAllVendorEmails('u1')
      expect(r.synced).toBe(1)
      expect(mUpsertMsg).toHaveBeenCalledWith(expect.objectContaining({ vendorId: 'v1', direction: 'inbound' }))
    })
  })

  describe('handleCallback', () => {
    it('exchanges code and upserts connection', async () => {
      gm.getToken!.mockResolvedValue({ tokens: { access_token: 'a', refresh_token: 'r', scope: 's', expiry_date: Date.now() + 3600000 } })
      gm.userinfoGet!.mockResolvedValue({ data: { email: 'user@example.com' } })
      mUpsertConn.mockResolvedValue(mockConnection); mConn.mockResolvedValue(mockConnection)
      mWedding.mockResolvedValue('w1'); mVendorEmails.mockResolvedValue(new Map())
      await svc.handleCallback('u1', 'code')
      expect(gm.getToken).toHaveBeenCalledWith('code')
      expect(mUpsertConn).toHaveBeenCalledWith('u1', expect.objectContaining({ email: 'user@example.com' }))
    })
    it('throws when tokens missing', async () => {
      gm.getToken!.mockResolvedValue({ tokens: { access_token: null, refresh_token: null } })
      await expect(svc.handleCallback('u1', 'x')).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    })
    it('throws when email missing', async () => {
      gm.getToken!.mockResolvedValue({ tokens: { access_token: 'a', refresh_token: 'r', expiry_date: Date.now() + 3600000 } })
      gm.userinfoGet!.mockResolvedValue({ data: { email: null } })
      await expect(svc.handleCallback('u1', 'x')).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    })
  })
})
