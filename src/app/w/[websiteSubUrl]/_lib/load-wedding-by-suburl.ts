import { cache } from 'react'

import type { WeddingPageData } from '~/server/domains/website/website.types'
import { api } from '~/trpc/server'

export type WeddingBySubUrlLoadResult =
  | { status: 'ready'; weddingData: WeddingPageData }
  | { status: 'password-required' }
  | { status: 'not-found' }

const isPasswordRequiredError = (error: unknown): boolean => {
  return (
    typeof error === 'object' && error !== null && 'code' in error && error.code === 'FORBIDDEN'
  )
}

const isWebsiteNotFoundError = (error: unknown): boolean => {
  return (
    typeof error === 'object' && error !== null && 'code' in error && error.code === 'NOT_FOUND'
  )
}

export const loadWeddingBySubUrl = cache(async (websiteSubUrl: string, accessToken?: string) => {
  if (!websiteSubUrl) {
    return { status: 'not-found' } as const
  }

  try {
    const weddingData = await api.website.fetchWeddingData({ subUrl: websiteSubUrl, accessToken })
    return {
      status: 'ready',
      weddingData,
    } satisfies WeddingBySubUrlLoadResult
  } catch (error) {
    if (isPasswordRequiredError(error)) {
      return { status: 'password-required' } as const
    }

    if (isWebsiteNotFoundError(error)) {
      return { status: 'not-found' } as const
    }

    throw error
  }
})
