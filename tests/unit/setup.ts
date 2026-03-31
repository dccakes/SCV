import '@testing-library/jest-dom'

import { TextDecoder, TextEncoder } from 'node:util'
import { TransformStream, ReadableStream, WritableStream } from 'node:stream/web'

// Polyfill for Prisma client in Jest
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder

// Polyfill for Vercel AI SDK (requires Web Streams API)
global.TransformStream = TransformStream as unknown as typeof global.TransformStream
global.ReadableStream = ReadableStream as unknown as typeof global.ReadableStream
global.WritableStream = WritableStream as unknown as typeof global.WritableStream

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  redirect: jest.fn(),
}))
