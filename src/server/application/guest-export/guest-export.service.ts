/**
 * Guest Export Application Service
 *
 * Gathers everything a couple needs to build a guest list file (guests,
 * households, per-event RSVPs and RSVP question answers) for one wedding.
 * The CSV itself is built on the client by ~/lib/guest-export/guest-export-csv.
 */

import type { GuestExportData } from '~/lib/guest-export/guest-export-csv'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'

export type GuestExportReader = {
  readWeddingGuestExport(weddingId: string): Promise<GuestExportData>
}

export class GuestExportService {
  constructor(private reader: GuestExportReader) {}

  async getExportData(authz: AuthzContext, weddingId: string): Promise<GuestExportData> {
    requirePermission(authz, { guest: ['read'], rsvp: ['export'] })
    return this.reader.readWeddingGuestExport(weddingId)
  }
}
