import { NextResponse } from 'next/server'

import { auth } from '~/lib/auth'
import { MAX_FILE_SIZE } from '~/lib/upload-config'
import { putServerBlob } from '~/server/infrastructure/storage/blob-server'

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { url?: string; vendorId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { url, vendorId } = body
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }
  if (!vendorId || typeof vendorId !== 'string') {
    return NextResponse.json({ error: 'vendorId is required' }, { status: 400 })
  }

  // Prevent SSRF — only allow http/https
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol')
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const imageResponse = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
    })
    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 422 })
    }

    const contentType = imageResponse.headers.get('content-type') ?? 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'URL does not point to an image' }, { status: 422 })
    }

    const buffer = await imageResponse.arrayBuffer()
    const sizeBytes = buffer.byteLength

    if (sizeBytes > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Image exceeds size limit' }, { status: 422 })
    }

    const urlPathname = parsedUrl.pathname
    const rawName = urlPathname.split('/').pop() ?? 'image'
    const name = rawName.includes('.') ? rawName : `${rawName}.jpg`

    const result = await putServerBlob({
      pathname: `vendor-images/${vendorId}/${name}`,
      body: Buffer.from(buffer),
      contentType,
    })

    return NextResponse.json({
      url: result.url,
      key: result.pathname,
      size: sizeBytes,
      name,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
  }
}
