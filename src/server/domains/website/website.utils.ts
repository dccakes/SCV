import { computePublicWebsiteUrl } from '~/lib/website/public-url'

export const computeWebsiteUrl = (subUrl: string): string => computePublicWebsiteUrl(subUrl)
