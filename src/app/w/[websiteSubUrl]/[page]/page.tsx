import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadVisitorWedding } from '~/app/w/[websiteSubUrl]/_lib/load-visitor-wedding'
import { grantWebsiteAccess } from '~/app/w/[websiteSubUrl]/_lib/website-access'
import PasswordPage from '~/components/website/password-page'
import { resolveTemplate, TemplateThemeProvider } from '~/templates'
import { VoyageContentPage } from '~/templates/voyage/components/content-page'
import { coupleIdentity, isVoyagePage, voyagePages } from '~/templates/voyage/site'

type Props = { params: Promise<{ websiteSubUrl: string; page: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { websiteSubUrl, page } = await params
  if (!isVoyagePage(page)) return { title: 'Wedding Website' }
  const { loadResult } = await loadVisitorWedding(websiteSubUrl)
  // Never put wedding data into metadata before the guest has cleared the gate.
  if (
    loadResult.status !== 'ready' ||
    loadResult.weddingData.website.templateId !== 'voyage' ||
    !loadResult.weddingData.websiteBuilderEnabled
  ) {
    return { title: 'Wedding Website' }
  }
  return {
    title: `${voyagePages[page].title} — ${coupleIdentity(loadResult.weddingData).coupleNames}`,
    description: voyagePages[page].description,
    icons: [{ rel: 'icon', url: `/w/${websiteSubUrl}/icon`, type: 'image/png', sizes: '32x32' }],
  }
}

export default async function VoyagePageRoute({ params }: Props) {
  const { websiteSubUrl, page } = await params
  if (!isVoyagePage(page)) return notFound()
  const { loadResult } = await loadVisitorWedding(websiteSubUrl)
  if (loadResult.status === 'not-found') return notFound()
  if (loadResult.status === 'password-required') {
    async function verifyWebsitePassword(password: string) {
      'use server'
      return grantWebsiteAccess(websiteSubUrl, password)
    }
    return <PasswordPage verifyWebsitePassword={verifyWebsitePassword} />
  }
  const { weddingData } = loadResult
  const template = resolveTemplate(weddingData.website.templateId)
  if (template.id !== 'voyage' || !weddingData.websiteBuilderEnabled) return notFound()
  return (
    <TemplateThemeProvider template={template}>
      <main>
        <VoyageContentPage weddingData={weddingData} path={`/w/${websiteSubUrl}`} page={page} />
      </main>
    </TemplateThemeProvider>
  )
}
