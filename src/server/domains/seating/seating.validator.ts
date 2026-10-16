import { z } from 'zod'

import { MAX_TABLE_CAPACITY, MIN_TABLE_CAPACITY } from '~/server/domains/seating/seating.rules'

export const seatingTableShapeSchema = z.enum(['ROUND', 'RECTANGULAR'])

export const tableNameSchema = z
  .string()
  .trim()
  .min(1, 'Table name is required')
  .max(50, 'Table name must be 50 characters or less')

export const capacitySchema = z
  .number()
  .int()
  .min(MIN_TABLE_CAPACITY, `Tables need at least ${MIN_TABLE_CAPACITY} seat`)
  .max(MAX_TABLE_CAPACITY, `Tables can have at most ${MAX_TABLE_CAPACITY} seats`)

const positionSchema = z.number().int().min(0).max(10_000)

const guestIdsSchema = z.array(z.number().int().positive()).min(1).max(200)

export const seatingEventIdSchema = z.object({ eventId: z.string().min(1) })

export const createSeatingTableSchema = z.object({
  eventId: z.string().min(1),
  name: tableNameSchema,
  shape: seatingTableShapeSchema,
  capacity: capacitySchema,
  positionX: positionSchema,
  positionY: positionSchema,
})

export const updateSeatingTableSchema = z.object({
  id: z.string().min(1),
  data: z.object({
    name: tableNameSchema.optional(),
    shape: seatingTableShapeSchema.optional(),
    capacity: capacitySchema.optional(),
    positionX: positionSchema.optional(),
    positionY: positionSchema.optional(),
  }),
})

export const seatingTableIdSchema = z.object({ id: z.string().min(1) })

export const assignGuestsSchema = z.object({
  tableId: z.string().min(1),
  guestIds: guestIdsSchema,
})

export const unassignGuestsSchema = z.object({
  eventId: z.string().min(1),
  guestIds: guestIdsSchema,
})
