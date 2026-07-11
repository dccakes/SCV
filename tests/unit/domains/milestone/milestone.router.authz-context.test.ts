import { TRPCError } from '@trpc/server'

jest.mock('lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))

jest.mock('server/db', () => ({ db: {} }))

jest.mock('~/server/domains/milestone', () => ({
  milestoneService: {
    attestMilestone: jest.fn(),
    clearOverride: jest.fn(),
    dismissMilestone: jest.fn(),
    getEffectiveMilestones: jest.fn(),
  },
}))

import { milestoneService } from '~/server/domains/milestone'
import { milestoneRouter } from '~/server/domains/milestone/milestone.router'

const mockGetEffectiveMilestones = milestoneService.getEffectiveMilestones as jest.Mock
const mockAttestMilestone = milestoneService.attestMilestone as jest.Mock

describe('milestoneRouter authz context plumbing', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('scopes getAll to the active wedding and forwards authz context', async () => {
    const activeOrganization = { organizationId: 'org-123', role: 'member' as const }
    mockGetEffectiveMilestones.mockResolvedValue([{ id: 'milestone-1' }])

    const caller = milestoneRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: 'wedding-123',
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await caller.getAll({})

    expect(mockGetEffectiveMilestones).toHaveBeenCalledWith(
      { userId: 'user-123', activeOrganization },
      'wedding-123'
    )
  })

  it('passes milestone id and wedding scope to attest', async () => {
    const activeOrganization = { organizationId: 'org-123', role: 'owner' as const }
    mockAttestMilestone.mockResolvedValue({ id: 'milestone-1' })

    const caller = milestoneRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: 'wedding-123',
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await caller.attest({ milestoneId: 'milestone-1' })

    expect(mockAttestMilestone).toHaveBeenCalledWith(
      { userId: 'user-123', activeOrganization },
      'milestone-1',
      'wedding-123'
    )
  })

  it('rejects unauthenticated getAll with UNAUTHORIZED', async () => {
    const caller = milestoneRouter.createCaller({
      auth: {
        session: null,
        activeOrganization: null,
        activeWeddingId: 'wedding-123',
        userId: null,
      },
      authz: {
        userId: '',
        activeOrganization: null,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(caller.getAll({})).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('rejects getAll when active wedding is missing', async () => {
    const activeOrganization = { organizationId: 'org-123', role: 'owner' as const }
    const caller = milestoneRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: null,
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(caller.getAll({})).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
    })
  })

  it('passes through service-level forbidden errors', async () => {
    const activeOrganization = { organizationId: 'org-123', role: 'viewer' as const }
    mockGetEffectiveMilestones.mockRejectedValue(new TRPCError({ code: 'FORBIDDEN' }))

    const caller = milestoneRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: 'wedding-123',
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(caller.getAll({})).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })
})
