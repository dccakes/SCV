import { isValidPhoneNumber } from 'libphonenumber-js'
import { z } from 'zod'

const E164_REGEX = /^\+[1-9]\d{1,14}$/

export function isValidE164Phone(value: string | null | undefined): boolean {
  if (value == null || value === '') return true
  if (!E164_REGEX.test(value)) return false
  return isValidPhoneNumber(value)
}

export const optionalPhoneSchema = z
  .union([
    z.literal('').transform(() => null),
    z.null(),
    z.string().refine(isValidE164Phone, { message: 'Please enter a valid phone number' }),
  ])
  .optional()

export const optionalPhoneSchemaNotNull = z
  .union([
    z.literal('').transform(() => undefined),
    z.string().refine(isValidE164Phone, { message: 'Please enter a valid phone number' }),
  ])
  .optional()
