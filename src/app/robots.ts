import type { MetadataRoute } from 'next'
import { getPublicWebsiteBaseUrl } from '~/lib/website/public-url'

const siteUrl = getPublicWebsiteBaseUrl()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
