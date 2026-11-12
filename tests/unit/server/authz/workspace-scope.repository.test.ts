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

    const makeTx = (linked: number) => ({
      organization: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.id })),
      },
      wedding: { updateMany: jest.fn().mockResolvedValue({ count: linked }) },
    })

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

    it('rolls back and reports false when another request linked the wedding first', async () => {
      const tx = makeTx(0)
      mockTransaction.mockImplementation((fn: (t: unknown) => unknown) => fn(tx))
      await expect(repository.attachOrganization(input)).resolves.toBe(false)
    })

    it('reports false on the workspace slug collision from a concurrent attach', async () => {
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
