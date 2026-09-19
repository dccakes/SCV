'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { legacyVoyageAnchors } from '~/templates/voyage/site'

/** Hashes never reach the server; resolve old shared links after hydration. */
export function VoyageLegacyLinks({ path }: { path: string }) {
  const router = useRouter()
  useEffect(() => {
    function followLegacyLink() {
      const anchor = window.location.hash.slice(1)
      const destination =
        legacyVoyageAnchors[anchor] ?? (anchor.startsWith('stay-') ? `stay#${anchor}` : null)
      if (destination) router.replace(`${path}/${destination}`)
    }
    followLegacyLink()
    window.addEventListener('hashchange', followLegacyLink)
    return () => window.removeEventListener('hashchange', followLegacyLink)
  }, [path, router])
  return null
}
