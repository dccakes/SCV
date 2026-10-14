import type { ResolverOptions } from 'react-hook-form'
import { z } from 'zod'

import { zodFormResolver } from '~/lib/forms/zod-form-resolver'

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(3, 'Too long'),
  seats: z.number().min(1, 'At least 1'),
})
type Values = z.infer<typeof schema>
const options = { fields: {}, shouldUseNativeValidation: false } as ResolverOptions<Values>

describe('zodFormResolver', () => {
  it('returns parsed values when valid', async () => {
    const result = await zodFormResolver(schema)({ name: ' Al ', seats: 2 }, undefined, options)
    expect(result).toEqual({ values: { name: 'Al', seats: 2 }, errors: {} })
  })

  it('maps zod 4 issues to field errors, first issue per field', async () => {
    const result = await zodFormResolver(schema)({ name: '', seats: 0 }, undefined, options)
    expect(result.values).toEqual({})
    expect(result.errors).toMatchObject({
      name: { message: 'Name is required' },
      seats: { message: 'At least 1' },
    })
  })
})
