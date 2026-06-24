import { notFound } from 'next/navigation'
import type { WeddingPageData } from '~/server/domains/website/website.types'
import { resolveTemplate, TemplateThemeProvider } from '~/templates'

/** Content-bearing template surfaces reachable via their own public route. */
type SurfaceKey = 'SaveTheDate' | 'Invitation'

type WeddingSurfaceProps = {
  websiteSubUrl: string
  weddingData: WeddingPageData
  surface: SurfaceKey
}

/**
 * Renders a single template surface (Save the Date, Invitation, …) inside the
 * couple's selected template theme. These surfaces are part of the website
 * builder, so they 404 when the plugin is disabled — only the minimal home page
 * remains public in that state.
 */
export default function WeddingSurface({
  websiteSubUrl,
  weddingData,
  surface,
}: Readonly<WeddingSurfaceProps>) {
  if (!weddingData.websiteBuilderEnabled) {
    notFound()
  }

  const path = `/w/${websiteSubUrl}`
  const introText = weddingData.website.introText.trim() ? weddingData.website.introText : undefined
  const template = resolveTemplate(weddingData.website.templateId)
  const Surface = template.components[surface]

  return (
    <TemplateThemeProvider template={template}>
      <Surface weddingData={weddingData} path={path} introText={introText} />
    </TemplateThemeProvider>
  )
}
