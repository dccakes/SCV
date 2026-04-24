import { cache } from 'react'
import { api } from '~/trpc/server'

export const loadWeddingBySubUrl = cache(async (websiteSubUrl: string, accessToken?: string) => {
  if (!websiteSubUrl) return undefined
  return api.website.fetchWeddingData({ subUrl: websiteSubUrl, accessToken }).catch(() => undefined)
})
