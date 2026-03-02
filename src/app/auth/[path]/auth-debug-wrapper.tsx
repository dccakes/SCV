'use client'

import { useEffect } from 'react'
import { AuthView } from '@daveyplate/better-auth-ui'

export function AuthDebugWrapper({ path }: { path: string }) {
  useEffect(() => {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    console.log('[auth-debug] NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
    console.log('[auth-debug] auth client baseURL:', baseURL)
    console.log('[auth-debug] window.location.origin:', window.location.origin)

    const originalFetch = window.fetch
    window.fetch = async function (...args) {
      const [input, init] = args
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

      if (!url.includes('/api/auth')) {
        return originalFetch(...args)
      }

      console.log('[auth-debug] fetch →', init?.method ?? 'GET', url, init?.body ? JSON.parse(init.body as string) : '')

      try {
        const response = await originalFetch(...args)
        const cloned = response.clone()
        cloned.text().then((body) => {
          console.log('[auth-debug] fetch ←', response.status, url, body.slice(0, 500))
        })
        return response
      } catch (err) {
        console.error('[auth-debug] fetch error', url, err)
        throw err
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return <AuthView path={path} />
}
