/**
 * Server-only Vercel Blob upload helper.
 *
 * Wraps `@vercel/blob` `put()` so callers don't have to wire the token,
 * choose `access`, or compute byte lengths themselves.
 */

import { put } from '@vercel/blob'
import { env } from '~/env'

export interface PutServerBlobArgs {
  pathname: string
  body: ArrayBuffer | Buffer | Uint8Array
  contentType: string
}

export interface PutServerBlobResult {
  url: string
  pathname: string
  size: number
  contentType: string
}

function byteLength(body: ArrayBuffer | Buffer | Uint8Array): number {
  if (Buffer.isBuffer(body)) return body.length
  if (body instanceof ArrayBuffer) return body.byteLength
  return body.byteLength
}

export async function putServerBlob(args: PutServerBlobArgs): Promise<PutServerBlobResult> {
  const token = env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured')
  }

  // @vercel/blob's `PutBody` accepts Buffer and ArrayBuffer but not Uint8Array
  // directly; at runtime it handles typed arrays fine, so we pass through.
  const result = await put(args.pathname, args.body as Buffer, {
    access: 'public',
    token,
    contentType: args.contentType,
    addRandomSuffix: true,
  })

  return {
    url: result.url,
    pathname: result.pathname,
    size: byteLength(args.body),
    contentType: args.contentType,
  }
}
