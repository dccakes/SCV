import { TRPCError } from '@trpc/server'
import { GuestExportService } from '~/server/application/guest-export/guest-export.service'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'

jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))
// Wrap the real check so tests can assert on it or force it to fail
jest.mock('~/server/authz/permission-checker', () => {
  const actual = jest.requireActual('~/server/authz/permission-checker')
  return { ...actual, requirePermission: jest.fn(actual.requirePermission) }
})

const mockRequirePermission = requirePermission as jest.Mock
const realRequirePermission = jest.requireActual('~/server/authz/permission-checker')
  .requirePermission as typeof requirePermission

describe('GuestExportService', () => {
  const buildAuthz = (role: 'owner' | 'admin' | 'member' | 'viewer'): AuthzContext => ({
    userId: 'user-1',
    activeOrganization: { organizationId: 'org-1', role },
  })

  const exportData = {
    events: [],
    questions: [],
    households: [],
    guests: [],
    invitations: [],
    answers: [],
  }
  const reader = { readWeddingGuestExport: jest.fn() }
  const service = new GuestExportService(reader)

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequirePermission.mockImplementation(realRequirePermission)
    reader.readWeddingGuestExport.mockResolvedValue(exportData)
  })

  it('reads the export for the active wedding when the caller can export RSVPs', async () => {
    await expect(service.getExportData(buildAuthz('member'), 'wedding-1')).resolves.toBe(exportData)
    expect(reader.readWeddingGuestExport).toHaveBeenCalledWith('wedding-1')
  })

  it('requires both guest read and RSVP export permission', async () => {
    await service.getExportData(buildAuthz('owner'), 'wedding-1')

    expect(mockRequirePermission).toHaveBeenCalledWith(expect.anything(), {
      guest: ['read'],
      rsvp: ['export'],
    })
  })

  it('does not read any data when the permission check fails', async () => {
    mockRequirePermission.mockImplementation(() => {
      throw new TRPCError({ code: 'FORBIDDEN' })
    })

    await expect(service.getExportData(buildAuthz('owner'), 'wedding-1')).rejects.toThrow(TRPCError)
    expect(reader.readWeddingGuestExport).not.toHaveBeenCalled()
  })

  it('rejects viewers', async () => {
    await expect(service.getExportData(buildAuthz('viewer'), 'wedding-1')).rejects.toThrow(
      TRPCError
    )
  })
})
