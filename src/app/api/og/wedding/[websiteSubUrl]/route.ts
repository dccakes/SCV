import sharp from 'sharp'

import { loadWeddingBySubUrl } from '~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl'

const DEFAULT_OG_IMAGE_WIDTH = 1200
const DEFAULT_OG_IMAGE_HEIGHT = 630

type RouteProps = {
  params: Promise<{
    websiteSubUrl: string
  }>
}

async function generateWeddingOgImage(
  brideFirstName: string | null,
  brideLastName: string | null,
  groomFirstName: string | null,
  groomLastName: string | null,
  headerImageUrl: string | null
): Promise<Buffer> {
  const brideName = brideFirstName && brideLastName ? `${brideFirstName} ${brideLastName}` : null
  const groomName = groomFirstName && groomLastName ? `${groomFirstName} ${groomLastName}` : null

  const displayBrideName = brideName || 'Wedding'
  const displayGroomName = groomName || 'Website'

  const createDefaultImage = () =>
    sharp({
      create: {
        width: DEFAULT_OG_IMAGE_WIDTH,
        height: DEFAULT_OG_IMAGE_HEIGHT,
        channels: 3,
        background: { r: 245, g: 245, b: 245 },
      },
    })

  let baseImage = createDefaultImage()

  if (headerImageUrl) {
    try {
      const response = await fetch(headerImageUrl, { signal: AbortSignal.timeout(5000) })
      if (response.ok) {
        const buffer = await response.arrayBuffer()
        baseImage = sharp(buffer).resize(DEFAULT_OG_IMAGE_WIDTH, DEFAULT_OG_IMAGE_HEIGHT, {
          fit: 'cover',
          position: 'center',
        })
      }
    } catch {
      // If image fetch fails, use the default background
    }
  }

  const svgOverlay = generateSvgOverlay(displayBrideName, displayGroomName)

  return baseImage
    .composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer()
}

function generateSvgOverlay(brideName: string, groomName: string): string {
  return `<svg width="${DEFAULT_OG_IMAGE_WIDTH}" height="${DEFAULT_OG_IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      </style>
    </defs>
    <rect width="${DEFAULT_OG_IMAGE_WIDTH}" height="${DEFAULT_OG_IMAGE_HEIGHT}" fill="rgba(0, 0, 0, 0.35)"/>
    <text
      x="${DEFAULT_OG_IMAGE_WIDTH / 2}"
      y="${DEFAULT_OG_IMAGE_HEIGHT / 2 - 20}"
      font-size="64"
      font-weight="bold"
      fill="white"
      text-anchor="middle"
    >${escapeXml(brideName)}</text>
    <text
      x="${DEFAULT_OG_IMAGE_WIDTH / 2}"
      y="${DEFAULT_OG_IMAGE_HEIGHT / 2 + 60}"
      font-size="64"
      font-weight="bold"
      fill="white"
      text-anchor="middle"
    >${escapeXml(groomName)}</text>
    <line
      x1="${DEFAULT_OG_IMAGE_WIDTH / 2 - 120}"
      y1="${DEFAULT_OG_IMAGE_HEIGHT / 2 + 15}"
      x2="${DEFAULT_OG_IMAGE_WIDTH / 2 + 120}"
      y2="${DEFAULT_OG_IMAGE_HEIGHT / 2 + 15}"
      stroke="white"
      stroke-width="2"
      opacity="0.6"
    />
  </svg>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET({ params }: RouteProps) {
  try {
    const { websiteSubUrl } = await params

    const loadResult = await loadWeddingBySubUrl(websiteSubUrl)

    if (loadResult.status !== 'ready') {
      // Return a generic image for inaccessible weddings
      const buffer = await generateWeddingOgImage(null, null, null, null, null)

      return new Response(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          'CDN-Cache-Control': 'max-age=86400',
        },
      })
    }

    const {
      brideFirstName,
      brideLastName,
      groomFirstName,
      groomLastName,
      website: { headerImageUrl },
    } = loadResult.weddingData

    const buffer = await generateWeddingOgImage(
      brideFirstName,
      brideLastName,
      groomFirstName,
      groomLastName,
      headerImageUrl
    )

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
