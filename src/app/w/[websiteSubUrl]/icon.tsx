import { ImageResponse } from 'next/og'

import { loadWeddingBySubUrl } from '~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl'
import { TEMPLATE_CATALOG } from '~/templates/catalog'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

type IconRouteProps = {
  params: Promise<{ websiteSubUrl: string }>
}

export default async function Icon({ params }: IconRouteProps) {
  const { websiteSubUrl } = await params
  const loadResult = await loadWeddingBySubUrl(websiteSubUrl)

  let initials = 'W'
  let background = '#d98a6a'
  const color = '#ffffff'

  if (loadResult.status === 'ready') {
    const { brideFirstName, groomFirstName, website } = loadResult.weddingData
    const brideInitial = brideFirstName?.[0] ?? ''
    const groomInitial = groomFirstName?.[0] ?? ''
    initials = `${brideInitial}${groomInitial}`.toUpperCase() || 'W'

    const template =
      TEMPLATE_CATALOG.find((meta) => meta.id === website.templateId) ?? TEMPLATE_CATALOG[0]
    const [, accent] = template?.swatches ?? []
    background = accent ?? background
  }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background,
        color,
        fontSize: 18,
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </div>,
    { ...size }
  )
}
