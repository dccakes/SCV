import { api } from '~/trpc/server'

type WeddingData = Awaited<ReturnType<typeof api.website.fetchWeddingData.query>>

const weddingBySubUrlCache = new Map<string, Promise<WeddingData | undefined>>()

export const loadWeddingBySubUrl = async (websiteSubUrl: string) => {
  if (!websiteSubUrl) return undefined

  const cachedWedding = weddingBySubUrlCache.get(websiteSubUrl)
  if (cachedWedding) return cachedWedding

  const fetchPromise = api.website.fetchWeddingData
    .query({ subUrl: websiteSubUrl })
    .catch(() => undefined)

  weddingBySubUrlCache.set(websiteSubUrl, fetchPromise)
  return fetchPromise
}
