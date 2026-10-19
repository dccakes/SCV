import { toNestErrors } from '@hookform/resolvers'
import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'
import type { z } from 'zod'

/**
 * react-hook-form resolver for zod 4 schemas. The zodResolver in
 * @hookform/resolvers v3 throws on zod 4 errors instead of mapping them to
 * fields, so parse here and report the first issue per top-level field.
 */
export const zodFormResolver =
  <TValues extends FieldValues>(schema: z.ZodType<TValues, TValues>): Resolver<TValues> =>
  (values, _context, options) => {
    const result = schema.safeParse(values)
    if (result.success) return { values: result.data, errors: {} }

    const errors: Record<string, { type: string; message: string }> = {}
    for (const issue of result.error.issues) {
      const field = String(issue.path[0] ?? 'root')
      errors[field] ??= { type: issue.code, message: issue.message }
    }
    return { values: {}, errors: toNestErrors(errors as FieldErrors<TValues>, options) }
  }
