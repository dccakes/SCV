import { TRPCError } from '@trpc/server'
import { GuestExportService } from '~/server/application/guest-export/guest-export.service'
import type { AuthzContext } from '~/server/authz/authorization.types'

jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

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
    jest.resetAllMocks()
    reader.readWeddingGuestExport.mockResolvedValue(exportData)
  })

  it('reads the export for the active wedding when the caller can export RSVPs', async () => {
    await expect(service.getExportData(buildAuthz('member'), 'wedding-1')).resolves.toBe(exportData)
    expect(reader.readWeddingGuestExport).toHaveBeenCalledWith('wedding-1')
  })

  it('rejects viewers without reading any data', async () => {
    await expect(service.getExportData(buildAuthz('viewer'), 'wedding-1')).rejects.toThrow(
      TRPCError
    )
    expect(reader.readWeddingGuestExport).not.toHaveBeenCalled()
  })
})
