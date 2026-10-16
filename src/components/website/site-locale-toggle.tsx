import { LocaleToggle } from '~/components/locale-toggle'

/** Pill styling shared by every bare wedding-site surface's language toggle. */
export const siteLocaleToggleClassName =
  'rounded-full border border-border/60 bg-background/80 px-3 py-1.5 font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.2em] shadow-sm backdrop-blur-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/**
 * A small corner language toggle for wedding-site surfaces that don't render a
 * template navbar (password gate, RSVP, save the date, invitation), so guests
 * can always switch between English and Spanish. It sits below full-screen
 * overlays such as the envelope intro (z-50).
 */
export function SiteLocaleToggle() {
  return (
    <div className='fixed top-4 right-4 z-40'>
      <LocaleToggle className={siteLocaleToggleClassName} />
    </div>
  )
}
