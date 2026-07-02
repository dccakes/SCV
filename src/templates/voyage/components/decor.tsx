/**
 * Voyage decorative artwork
 *
 * The template's watercolour illustrations (floral sprays, corner clusters,
 * church/hacienda sketches, milestone vignettes) live as transparent PNGs in
 * `public/templates/voyage/decor/`. This module resolves which assets exist at
 * render time (server-side) and falls back to the hand-drawn SVG primitives
 * when a file is missing, so the template never renders a broken image while
 * the artwork set is incomplete.
 *
 * To add or replace artwork, drop a PNG with the matching filename into the
 * decor directory — no code change needed.
 */

import fs from 'node:fs'
import path from 'node:path'
import type { ReactNode } from 'react'

/** Expected artwork files, by decorative role. */
export const DECOR_FILES = {
  /** Tall rose/peony spray — section side accents. */
  floralSpray: 'floral-spray.png',
  /** Second tall spray variant, for variety on facing edges. */
  floralSpray2: 'floral-spray-2.png',
  /** Delicate small-bloom branch — lighter side accent. */
  floralBranch: 'floral-branch.png',
  /** Corner cluster (roses anchored to a corner). */
  floralCorner: 'floral-corner.png',
  /** Second corner variant (arched top-corner cluster). */
  floralCorner2: 'floral-corner-2.png',
  /** Church facade with floral flourish — the hero card seal. */
  churchSeal: 'church-seal.png',
  /** Church front with trees — timeline "wedding day" vignette. */
  church: 'church.png',
  /** Wide hacienda courtyard sketch — RSVP band illustration. */
  hacienda: 'hacienda.png',
  /** Coffee cups vignette — timeline "first hello". */
  coffee: 'coffee.png',
  /** Mountain landscape vignette — timeline "first trip". */
  mountains: 'mountains.png',
  /** Ring box vignette — timeline "proposal". */
  ringBox: 'ring-box.png',
} as const

export type DecorName = keyof typeof DECOR_FILES

const DECOR_DIR = path.join(process.cwd(), 'public', 'templates', 'voyage', 'decor')
const availability = new Map<string, boolean>()

function hasDecor(file: string): boolean {
  let known = availability.get(file)
  if (known === undefined) {
    try {
      known = fs.existsSync(path.join(DECOR_DIR, file))
    } catch {
      known = false
    }
    availability.set(file, known)
  }
  return known
}

/**
 * Renders the named artwork as a plain decorative <img> (sized via className,
 * e.g. `h-64 w-auto`), or the given fallback node when the PNG is absent.
 * Decorative only — always aria-hidden with an empty alt.
 */
export function Decor({
  name,
  className = '',
  fallback = null,
}: {
  name: DecorName
  className?: string
  fallback?: ReactNode
}) {
  const file = DECOR_FILES[name]
  if (!hasDecor(file)) {
    return <>{fallback}</>
  }
  return (
    // biome-ignore lint/performance/noImgElement: decorative artwork of unknown intrinsic size; next/image needs fixed dimensions
    <img
      src={`/templates/voyage/decor/${file}`}
      alt=''
      aria-hidden='true'
      loading='lazy'
      className={className}
    />
  )
}
