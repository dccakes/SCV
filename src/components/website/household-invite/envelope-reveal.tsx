'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

type EnvelopeRevealProps = {
  /** Stable per-website key so the intro plays once per browser session. */
  websiteSubUrl: string
  /** Couple names shown on the letter peeking out of the envelope. */
  coupleNames: string
  /** The real invite card, rendered on the server and revealed after the intro. */
  children: ReactNode
}

type Phase = 'pending' | 'playing' | 'done'

// Keep in sync with the keyframe delays/durations in globals.css: the last
// animation (card-in) starts at 1900ms and runs 600ms.
const INTRO_DURATION_MS = 2500

const storageKeyFor = (websiteSubUrl: string) => `household_invite_envelope_${websiteSubUrl}`

/**
 * Plays a one-time "letter sliding out of an envelope" intro over the household
 * invite card, then reveals the real card. It is progressive enhancement: the
 * card is always rendered (server-side), so it stays visible with JS disabled.
 * The intro is skipped when the guest prefers reduced motion or has already seen
 * it this session.
 */
export function EnvelopeReveal({
  websiteSubUrl,
  coupleNames,
  children,
}: Readonly<EnvelopeRevealProps>) {
  const [phase, setPhase] = useState<Phase>('pending')

  useEffect(() => {
    // Without matchMedia we can't honour reduced-motion preferences, so skip the
    // intro and show the card immediately rather than risk an unwanted animation.
    const canCheckMotion = typeof window.matchMedia === 'function'
    const prefersReducedMotion =
      canCheckMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let alreadyPlayed = false
    try {
      alreadyPlayed = window.sessionStorage.getItem(storageKeyFor(websiteSubUrl)) === '1'
    } catch {
      // sessionStorage can throw (private mode, blocked cookies); just play it.
    }

    if (!canCheckMotion || prefersReducedMotion || alreadyPlayed) {
      setPhase('done')
      return
    }

    setPhase('playing')
    try {
      window.sessionStorage.setItem(storageKeyFor(websiteSubUrl), '1')
    } catch {
      // Non-fatal: the intro simply isn't remembered across reloads.
    }

    const timer = window.setTimeout(() => setPhase('done'), INTRO_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [websiteSubUrl])

  return (
    <>
      {/*
        The card wrapper is transformed during the reveal. The intro overlay is a
        sibling (not a child) so the wrapper's transform doesn't become the
        containing block for its `fixed` positioning.
      */}
      <div className={`w-full ${phase === 'playing' ? 'envelope-reveal-card' : ''}`}>
        {children}
      </div>
      {phase === 'playing' ? <EnvelopeIntro coupleNames={coupleNames} /> : null}
    </>
  )
}

/**
 * The full-screen envelope graphic. The front is decomposed into four triangles
 * meeting at the centre — the top one is the flap that opens, the other three
 * form the pocket and fully cover the letter while the envelope is closed.
 */
function EnvelopeIntro({ coupleNames }: Readonly<{ coupleNames: string }>) {
  return (
    <div
      aria-hidden='true'
      className='envelope-overlay fixed inset-0 z-50 flex items-center justify-center bg-background px-6'
    >
      <div className='envelope-scene relative h-60 w-80 sm:h-64 sm:w-96'>
        {/* Back panel the letter rests against. */}
        <div className='absolute inset-0 rounded-md border border-border bg-card shadow-foreground/10 shadow-xl' />

        {/* The letter, tucked inside and rising out at the centre seam. */}
        <div className='envelope-letter absolute inset-x-6 top-5 bottom-4 z-[5] flex flex-col items-center justify-center gap-3 rounded-sm border border-border bg-card px-6 text-center shadow-md'>
          <span className='block h-px w-10 bg-border' />
          <span className='font-[family-name:var(--tpl-heading-font)] text-2xl text-card-foreground italic leading-tight'>
            {coupleNames}
          </span>
          <span className='font-[family-name:var(--tpl-label-font,var(--tpl-body-font))] text-[0.6rem] text-muted-foreground uppercase tracking-[0.28em]'>
            {"You're Invited"}
          </span>
          <span className='block h-px w-10 bg-border' />
        </div>

        {/* Pocket front: left / right / bottom triangles meeting at centre. */}
        <div
          className='absolute inset-0 z-20 bg-muted'
          style={{ clipPath: 'polygon(0 0, 0 100%, 50% 50%)' }}
        />
        <div
          className='absolute inset-0 z-20 bg-muted'
          style={{ clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)' }}
        />
        <div
          className='absolute inset-0 z-20 rounded-b-md bg-secondary'
          style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 50%)' }}
        />

        {/* Top flap, hinged at the top edge — the piece that swings open. */}
        <div
          className='envelope-flap absolute inset-0 rounded-t-md bg-secondary'
          style={{ clipPath: 'polygon(0 0, 100% 0, 50% 50%)' }}
        />
      </div>
    </div>
  )
}
