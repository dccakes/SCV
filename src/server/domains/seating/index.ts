/**
 * Seating Domain - service wiring
 */

import { SeatingRepository } from '~/server/domains/seating/seating.repository'
import { SeatingService } from '~/server/domains/seating/seating.service'
import { db } from '~/server/infrastructure/database'

export const seatingService = new SeatingService(new SeatingRepository(db))
