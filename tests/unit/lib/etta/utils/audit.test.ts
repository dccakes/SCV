import { db } from '~/server/db'
import { logAudit } from '~/lib/etta/utils/audit'
import type { AuditEntry } from '~/lib/etta/types'

jest.mock('~/server/db', () => ({
  db: {
    auditLog: {
      create: jest.fn(),
    },
  },
}))

const mockAuditLog = db.auditLog as { create: jest.Mock }

const entry: AuditEntry = {
  weddingId: 'wedding-1',
  actorId: 'etta-actor-1',
  actorType: 'etta',
  action: 'generate_suggestion',
  resourceType: 'suggestion',
  resourceId: 'suggestion-42',
  tier: 'T0',
  payload: { prompt: 'hello' },
}

describe('logAudit', () => {
  it('writes audit entry with all fields', async () => {
    mockAuditLog.create.mockResolvedValue({ id: 'log-1' })

    await logAudit(entry)

    expect(mockAuditLog.create).toHaveBeenCalledWith({
      data: {
        weddingId: 'wedding-1',
        actorId: 'etta-actor-1',
        actorType: 'etta',
        action: 'generate_suggestion',
        resourceType: 'suggestion',
        resourceId: 'suggestion-42',
        tier: 'T0',
        payloadSnapshot: { prompt: 'hello' },
      },
    })
  })

  it('maps optional fields as undefined when not provided', async () => {
    mockAuditLog.create.mockResolvedValue({ id: 'log-2' })

    const minimal: AuditEntry = {
      weddingId: 'wedding-2',
      actorId: 'etta-actor-2',
      actorType: 'couple',
      action: 'view_dashboard',
      resourceType: 'dashboard',
    }

    await logAudit(minimal)

    expect(mockAuditLog.create).toHaveBeenCalledWith({
      data: {
        weddingId: 'wedding-2',
        actorId: 'etta-actor-2',
        actorType: 'couple',
        action: 'view_dashboard',
        resourceType: 'dashboard',
        resourceId: undefined,
        tier: undefined,
        payloadSnapshot: undefined,
      },
    })
  })

  it('does not throw on DB error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    mockAuditLog.create.mockRejectedValue(new Error('DB connection lost'))

    await expect(logAudit(entry)).resolves.toBeUndefined()

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Etta] Audit log failed:',
      expect.any(Error),
    )
    consoleSpy.mockRestore()
  })
})
