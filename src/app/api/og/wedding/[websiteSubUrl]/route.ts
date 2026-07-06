import type { NextRequest } from 'next/server'
import sharp from 'sharp'

import { loadWeddingBySubUrl } from '~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl'

const DEFAULT_OG_IMAGE_WIDTH = 1200
const DEFAULT_OG_IMAGE_HEIGHT = 630

async function generateWeddingOgImage(headerImageUrl: string | null): Promise<Buffer> {
  if (headerImageUrl) {
    try {
      const response = await fetch(headerImageUrl, { signal: AbortSignal.timeout(5000) })
      if (response.ok) {
        const buffer = await response.arrayBuffer()
        return sharp(buffer)
          .resize(DEFAULT_OG_IMAGE_WIDTH, DEFAULT_OG_IMAGE_HEIGHT, {
            fit: 'cover',
            position: 'center',
          })
          .png()
          .toBuffer()
      }
    } catch {
      // If image fetch fails, use default
    }
  }

  // Default background
  return sharp({
    create: {
      width: DEFAULT_OG_IMAGE_WIDTH,
      height: DEFAULT_OG_IMAGE_HEIGHT,
      channels: 3,
      background: { r: 245, g: 245, b: 245 },
    },
  })
    .png()
    .toBuffer()
}

export async function GET(_request: NextRequest, { params }: { params: Record<string, string> }) {
  try {
    const { websiteSubUrl } = params as { websiteSubUrl: string }

    const loadResult = await loadWeddingBySubUrl(websiteSubUrl)

    let headerImageUrl: string | null = null
    if (loadResult.status === 'ready') {
      headerImageUrl = loadResult.weddingData.website.headerImageUrl
    }

    const buffer = await generateWeddingOgImage(headerImageUrl)

    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'CDN-Cache-Control': 'max-age=86400',
      },
    })
  } catch {
    // Return a basic image on error
    const errorImage = await sharp({
      create: {
        width: DEFAULT_OG_IMAGE_WIDTH,
        height: DEFAULT_OG_IMAGE_HEIGHT,
        channels: 3,
        background: { r: 200, g: 200, b: 200 },
      },
    })
      .png()
      .toBuffer()

    return new Response(errorImage, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }
}
