import { api } from '~/trpc/server'

type WeddingData = Awaited<ReturnType<typeof api.website.fetchWeddingData.query>>

const weddingBySubUrlCache = new Map<string, Promise<WeddingData | undefined>>()

export const loadWeddingBySubUrl = async (websiteSubUrl: string, accessToken?: string) => {
  if (!websiteSubUrl) return undefined

  const cacheKey = `${websiteSubUrl}:${accessToken ?? ''}`

  const cachedWedding = weddingBySubUrlCache.get(cacheKey)
  if (cachedWedding) return cachedWedding

  const fetchPromise = api.website.fetchWeddingData
    .query({ subUrl: websiteSubUrl, accessToken })
    .catch(() => undefined)

  weddingBySubUrlCache.set(cacheKey, fetchPromise)
  return fetchPromise
}
