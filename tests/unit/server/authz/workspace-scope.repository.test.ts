jest.mock('~/server/db', () => ({
  db: {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $transaction: jest.fn(),
    userWedding: { findFirst: jest.fn() },
  },
}))

import { WorkspaceScopeRepository } from '~/server/authz/workspace-scope.repository'
import { db } from '~/server/db'

const mockQueryRaw = db.$queryRaw as unknown as jest.Mock
const mockExecuteRaw = db.$executeRaw as unknown as jest.Mock

describe('WorkspaceScopeRepository', () => {
  const repository = new WorkspaceScopeRepository()

  beforeEach(() => {
    mockQueryRaw.mockReset()
    mockExecuteRaw.mockReset()
  })

  it('findScopeForOrganization returns first row when present', async () => {
    mockQueryRaw.mockResolvedValue([
      {
        organizationId: 'org-1',
        isPrimaryWedding: false,
        role: 'admin',
        weddingId: 'wedding-1',
      },
      {
        organizationId: 'org-ignored',
        isPrimaryWedding: false,
        role: 'member',
        weddingId: 'wedding-ignored',
      },
    ])

    const result = await repository.findScopeForOrganization('user-1', 'org-1')

    expect(result).toEqual({
      organizationId: 'org-1',
      isPrimaryWedding: false,
      role: 'admin',
      weddingId: 'wedding-1',
    })
    expect(mockQueryRaw).toHaveBeenCalledTimes(1)
  })

  it('findCandidateScopes returns query results as-is', async () => {
    const rows = [
      {
        organizationId: 'org-primary',
        isPrimaryWedding: true,
        role: 'owner',
        weddingId: 'wedding-primary',
      },
    ]
    mockQueryRaw.mockResolvedValue(rows)

    const result = await repository.findCandidateScopes('user-1')

    expect(result).toEqual(rows)
    expect(mockQueryRaw).toHaveBeenCalledTimes(1)
  })

  it('setActiveOrganizationId is a no-op when session token is missing', async () => {
    await repository.setActiveOrganizationId(null, 'org-1')

    expect(mockExecuteRaw).not.toHaveBeenCalled()
  })

  it('setActiveOrganizationId writes when session token exists', async () => {
    mockExecuteRaw.mockResolvedValue(1)

    await repository.setActiveOrganizationId('tok-1', 'org-1')

    expect(mockExecuteRaw).toHaveBeenCalledTimes(1)
  })

  describe('organization-less weddings', () => {
    const mockFindFirst = db.userWedding.findFirst as unknown as jest.Mock
    const mockTransaction = db.$transaction as unknown as jest.Mock

    beforeEach(() => {
      mockFindFirst.mockReset()
      mockTransaction.mockReset()
    })

    it("finds the user's wedding that has no workspace, with everyone linked to it", async () => {
      mockFindFirst.mockResolvedValue({
        wedding: {
          id: 'wedding-1',
          groomFirstName: 'Sam',
          brideFirstName: 'Alex',
          userWeddings: [
            { userId: 'user-1', role: 'owner' },
            { userId: 'user-2', role: 'editor' },
          ],
        },
      })

      const result = await repository.findOrganizationlessWedding('user-1')

      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', wedding: { organizationId: null } },
        })
      )
      expect(result).toEqual({
        weddingId: 'wedding-1',
        groomFirstName: 'Sam',
        brideFirstName: 'Alex',
        members: [
          { userId: 'user-1', role: 'owner' },
          { userId: 'user-2', role: 'editor' },
        ],
      })
    })

    it('returns null when every wedding of the user already has a workspace', async () => {
      mockFindFirst.mockResolvedValue(null)
      expect(await repository.findOrganizationlessWedding('user-1')).toBeNull()
    })

    const input = {
      weddingId: 'wedding-1',
      name: 'Sam & Alex',
      slug: 'wedding-wedding-1',
      members: [{ userId: 'user-1', role: 'owner' as const }],
    }

    type ExistingOrg = {
      id: string
      members: Array<{ userId: string }>
      weddings: Array<{ id: string }>
    }

    const makeTx = (linked: number, existing: ExistingOrg | null = null) => ({
      organization: {
        findUnique: jest.fn().mockResolvedValue(existing),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.id })),
      },
      member: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
      wedding: { updateMany: jest.fn().mockResolvedValue({ count: linked }) },
    })

    const twoMembers = {
      ...input,
      members: [
        { userId: 'user-1', role: 'owner' as const },
        { userId: 'user-2', role: 'member' as const },
      ],
    }

    it('creates the workspace with its members and links it, in one transaction', async () => {
      const tx = makeTx(1)
      mockTransaction.mockImplementation((fn: (t: unknown) => unknown) => fn(tx))

      await expect(repository.attachOrganization(input)).resolves.toBe(true)

      const orgData = tx.organization.create.mock.calls[0][0].data
      expect(orgData).toMatchObject({
        name: 'Sam & Alex',
        slug: 'wedding-wedding-1',
        members: { create: [{ userId: 'user-1', role: 'owner' }] },
      })
      expect(tx.wedding.updateMany).toHaveBeenCalledWith({
        where: { id: 'wedding-1', organizationId: null },
        data: { organizationId: orgData.id },
      })
    })

    it('adopts the empty, unlinked workspace an interrupted migration leaves behind', async () => {
      // The migration creates the organization, links it, then adds members.
      const tx = makeTx(1, { id: 'org-orphan', members: [], weddings: [] })
      mockTransaction.mockImplementation((fn: (t: unknown) => unknown) => fn(tx))

      await expect(repository.attachOrganization(twoMembers)).resolves.toBe(true)

      expect(tx.organization.create).not.toHaveBeenCalled()
      expect(tx.member.createMany.mock.calls[0][0].data).toEqual([
        expect.objectContaining({ organizationId: 'org-orphan', userId: 'user-1', role: 'owner' }),
        expect.objectContaining({ organizationId: 'org-orphan', userId: 'user-2', role: 'member' }),
      ])
      expect(tx.wedding.updateMany).toHaveBeenCalledWith({
        where: { id: 'wedding-1', organizationId: null },
        data: { organizationId: 'org-orphan' },
      })
    })

    it('never adopts a workspace someone else created on the slug (takeover guard)', async () => {
      // Any signed-in user can create an organization with any slug and is its owner.
      const tx = makeTx(1, { id: 'org-squatter', members: [{ userId: 'attacker' }], weddings: [] })
      mockTransaction.mockImplementation((fn: (t: unknown) => unknown) => fn(tx))

      await expect(repository.attachOrganization(twoMembers)).resolves.toBe(true)

      expect(tx.member.createMany).not.toHaveBeenCalled()
      const orgData = tx.organization.create.mock.calls[0][0].data
      // A fresh workspace on a non-colliding slug, with only the wedding's own people.
      expect(orgData.slug).toMatch(/^wedding-wedding-1-[0-9a-f]{8}$/)
      expect(orgData.members.create.map((m: { userId: string }) => m.userId)).toEqual([
        'user-1',
        'user-2',
      ])
      expect(tx.wedding.updateMany).toHaveBeenCalledWith({
        where: { id: 'wedding-1', organizationId: null },
        data: { organizationId: orgData.id },
      })
    })

    it('never adopts a workspace already linked to another wedding', async () => {
      const tx = makeTx(1, { id: 'org-taken', members: [], weddings: [{ id: 'wedding-2' }] })
      mockTransaction.mockImplementation((fn: (t: unknown) => unknown) => fn(tx))

      await expect(repository.attachOrganization(input)).resolves.toBe(true)

      expect(tx.organization.create.mock.calls[0][0].data.slug).toMatch(
        /^wedding-wedding-1-[0-9a-f]{8}$/
      )
    })

    it('rolls back and reports false when another request linked the wedding first', async () => {
      const tx = makeTx(0)
      mockTransaction.mockImplementation((fn: (t: unknown) => unknown) => fn(tx))
      await expect(repository.attachOrganization(input)).resolves.toBe(false)
    })

    it('reports false on a unique-key race with a concurrent attach', async () => {
      mockTransaction.mockRejectedValue(
        Object.assign(new Error('Unique constraint'), { code: 'P2002' })
      )
      await expect(repository.attachOrganization(input)).resolves.toBe(false)
    })

    it('surfaces any other database failure', async () => {
      mockTransaction.mockRejectedValue(new Error('connection lost'))
      await expect(repository.attachOrganization(input)).rejects.toThrow('connection lost')
    })
  })
})
