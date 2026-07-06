import type { NextRequest } from 'next/server'
import sharp from 'sharp'

import { loadWeddingBySubUrl } from '~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl'

const DEFAULT_OG_IMAGE_WIDTH = 1200
const DEFAULT_OG_IMAGE_HEIGHT = 630

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}

function createTextOverlaySvg(headline: string, accent: string): string {
  const escapedHeadline = escapeXml(headline)
  const escapedAccent = escapeXml(accent)

  return `<svg width="${DEFAULT_OG_IMAGE_WIDTH}" height="${DEFAULT_OG_IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .headline { font-family: 'Georgia', serif; font-size: 56px; font-weight: bold; fill: white; text-anchor: middle; }
        .accent { font-family: 'Georgia', serif; font-size: 56px; font-weight: bold; fill: white; text-anchor: middle; }
      </style>
    </defs>
    <rect width="${DEFAULT_OG_IMAGE_WIDTH}" height="${DEFAULT_OG_IMAGE_HEIGHT}" fill="rgba(0,0,0,0.3)"/>
    <text x="${DEFAULT_OG_IMAGE_WIDTH / 2}" y="300" class="headline">${escapedHeadline}</text>
    <text x="${DEFAULT_OG_IMAGE_WIDTH / 2}" y="380" class="accent">${escapedAccent}</text>
  </svg>`
}

async function generateWeddingOgImage(
  headerImageUrl: string | null,
  headline?: string,
  accent?: string
): Promise<Buffer> {
  let baseImage = null

  if (headerImageUrl) {
    try {
      const response = await fetch(headerImageUrl, { signal: AbortSignal.timeout(5000) })
      if (response.ok) {
        const buffer = await response.arrayBuffer()
        baseImage = await sharp(buffer)
          .resize(DEFAULT_OG_IMAGE_WIDTH, DEFAULT_OG_IMAGE_HEIGHT, {
            fit: 'cover',
            position: 'center',
          })
          .toBuffer()
      }
    } catch {
      // If image fetch fails, use default
    }
  }

  if (!baseImage) {
    baseImage = await sharp({
      create: {
        width: DEFAULT_OG_IMAGE_WIDTH,
        height: DEFAULT_OG_IMAGE_HEIGHT,
        channels: 3,
        background: { r: 245, g: 245, b: 245 },
      },
    }).toBuffer()
  }

  // Overlay text if provided
  if (headline || accent) {
    const textSvg = createTextOverlaySvg(headline || '', accent || '')
    const textBuffer = Buffer.from(textSvg)
    // Convert SVG to PNG first
    const textPng = await sharp(textBuffer, { density: 150 }).png().toBuffer()

    const composited = await sharp(baseImage)
      .composite([
        {
          input: textPng,
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer()
    return composited
  }

  return await sharp(baseImage).png().toBuffer()
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ websiteSubUrl: string }> }
) {
  try {
    const { websiteSubUrl } = await params

    const loadResult = await loadWeddingBySubUrl(websiteSubUrl)

    let headerImageUrl: string | null = null
    let headline: string | undefined
    let accent: string | undefined

    if (loadResult.status === 'ready') {
      headerImageUrl = loadResult.weddingData.website.headerImageUrl
      headline = loadResult.weddingData.website.headline
      accent = loadResult.weddingData.website.headlineAccent
    }

    const buffer = await generateWeddingOgImage(headerImageUrl, headline, accent)

    return new Response(new Blob([new Uint8Array(buffer)], { type: 'image/png' }), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'CDN-Cache-Control': 'max-age=86400',
      },
    })
  } catch {
    // Return a basic image on error
    const errorImageBuffer = await sharp({
      create: {
        width: DEFAULT_OG_IMAGE_WIDTH,
        height: DEFAULT_OG_IMAGE_HEIGHT,
        channels: 3,
        background: { r: 200, g: 200, b: 200 },
      },
    })
      .png()
      .toBuffer()

    return new Response(new Blob([new Uint8Array(errorImageBuffer)], { type: 'image/png' }), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }
}
