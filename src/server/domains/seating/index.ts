/**
 * Seating Domain - Barrel Export
 */

import { SeatingRepository } from '~/server/domains/seating/seating.repository'
import { SeatingService } from '~/server/domains/seating/seating.service'
import { db } from '~/server/infrastructure/database'

const seatingRepository = new SeatingRepository(db)
export const seatingService = new SeatingService(seatingRepository)

export { SeatingRepository } from '~/server/domains/seating/seating.repository'
export { SeatingService } from '~/server/domains/seating/seating.service'
export type {
  SeatingChart,
  SeatingGuest,
  SeatingHousehold,
  SeatingTableShape,
  SeatingTableView,
} from '~/server/domains/seating/seating.types'
