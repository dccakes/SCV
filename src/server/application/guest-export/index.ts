import { PrismaGuestExportReader } from '~/server/application/guest-export/guest-export.reader'
import { GuestExportService } from '~/server/application/guest-export/guest-export.service'
import { db } from '~/server/infrastructure/database'

export const guestExportService = new GuestExportService(new PrismaGuestExportReader(db))

export { GuestExportService } from '~/server/application/guest-export/guest-export.service'
