/**
 * @jest-environment node
 */
import { trace } from '@opentelemetry/api'
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { TRPCError } from '@trpc/server'

jest.mock('lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))

jest.mock('server/db', () => ({ db: {} }))

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { ForbiddenError, NotFoundError } from '~/server/domains/shared/domain-error'

const exporter = new InMemorySpanExporter()
trace.setGlobalTracerProvider(
  new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] })
)

const cause = new Error('db detail')

const router = createTRPCRouter({
  publicMissing: publicProcedure.query(() => {
    throw new NotFoundError('Guest not found', { cause })
  }),
  protectedForbidden: protectedProcedure.mutation(() => {
    throw new ForbiddenError()
  }),
  plainError: publicProcedure.query(() => {
    throw new Error('unexpected')
  }),
})

const ctx = {
  auth: {
    session: { user: { id: 'user-1' } },
    activeOrganization: null,
    activeWeddingId: 'wedding-1',
    userId: 'user-1',
  },
  db: {} as never,
  headers: new Headers(),
}

beforeEach(() => exporter.reset())

describe('domainErrorMiddleware', () => {
  it('maps a domain error thrown by a public resolver to its tRPC code and message', async () => {
    const error = await router
      .createCaller(ctx as never)
      .publicMissing()
      .catch((e: unknown) => e)

    expect(error).toBeInstanceOf(TRPCError)
    expect(error).toMatchObject({ code: 'NOT_FOUND', message: 'Guest not found' })
    expect((error as TRPCError).cause).toBeInstanceOf(NotFoundError)
  })

  it('maps a domain error thrown by a protected resolver', async () => {
    await expect(router.createCaller(ctx as never).protectedForbidden()).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'FORBIDDEN',
    })
  })

  it('records the mapped HTTP status on the procedure span', async () => {
    await router
      .createCaller(ctx as never)
      .publicMissing()
      .catch(() => undefined)

    const [span] = exporter.getFinishedSpans()
    expect(span?.attributes['trpc.error_code']).toBe('NOT_FOUND')
    expect(span?.attributes['http.response.status_code']).toBe(404)
  })

  it('leaves non-domain errors as INTERNAL_SERVER_ERROR', async () => {
    await expect(router.createCaller(ctx as never).plainError()).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    })
  })
})

describe('procedure builder coverage', () => {
  it('has a single tRPC instance, so every procedure builds on the mapped base procedure', () => {
    const { readdirSync, readFileSync } = jest.requireActual<typeof import('node:fs')>('node:fs')
    const hits = readdirSync('src', { recursive: true, encoding: 'utf8' })
      .filter((file) => /\.tsx?$/.test(file))
      .filter((file) => readFileSync(`src/${file}`, 'utf8').includes('initTRPC'))
      .map((file) => `src/${file}`)

    expect(hits).toEqual(['src/server/api/trpc.ts'])
  })
})
