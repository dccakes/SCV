/**
 * Voyage shared primitives
 *
 * The bespoke editorial vocabulary used across every Voyage surface: eyebrow
 * labels, champagne rules, buttons with wide tracking, and a set of thin-line
 * SVG icons and botanical/landmark illustrations drawn by hand (stroke =
 * currentColor) so they inherit champagne gold and never look stock.
 */

import Link from 'next/link'
import type { ReactNode, SVGProps } from 'react'

export const headingFont = 'font-[family-name:var(--tpl-heading-font)]'
export const bodyFont = 'font-[family-name:var(--tpl-body-font)]'
export const labelFont = 'font-[family-name:var(--tpl-label-font)]'

/** Small uppercase, wide-tracked gold label sitting above a heading. */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`${labelFont} text-[#B89455] text-[0.62rem] uppercase tracking-[0.42em] ${className}`}
    >
      {children}
    </span>
  )
}

/** A thin champagne rule, optionally centered with a small diamond node. */
export function GoldRule({ className = '' }: { className?: string }) {
  return <span className={`block h-px w-14 bg-[#B89455]/60 ${className}`} aria-hidden='true' />
}

type ButtonProps = {
  href: string
  children: ReactNode
  external?: boolean
  className?: string
}

const buttonBase = `${labelFont} inline-flex items-center justify-center gap-2 text-[0.68rem] uppercase tracking-[0.28em] transition-colors duration-300`

/** Champagne-filled primary action. */
export function PrimaryButton({ href, children, external, className = '' }: ButtonProps) {
  const cls = `${buttonBase} rounded-[2px] bg-[#B89455] px-8 py-3.5 text-[#181611] hover:bg-[#A6824A] ${className}`
  return external ? (
    <a href={href} target='_blank' rel='noreferrer' className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  )
}

/** Thin-outline secondary action. */
export function OutlineButton({ href, children, external, className = '' }: ButtonProps) {
  const cls = `${buttonBase} rounded-[2px] border border-[#1E1C18]/35 px-8 py-3.5 text-[#1E1C18] hover:border-[#1E1C18] ${className}`
  return external ? (
    <a href={href} target='_blank' rel='noreferrer' className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  )
}

/** Light-outline action for dark backgrounds (hero). */
export function GhostButtonOnDark({ href, children, className = '' }: ButtonProps) {
  return (
    <Link
      href={href}
      className={`${buttonBase} rounded-[2px] border border-[#F8F1E7]/40 px-8 py-3.5 text-[#F8F1E7] hover:border-[#F8F1E7] ${className}`}
    >
      {children}
    </Link>
  )
}

// — Thin-line icons ————————————————————————————————————————————————

const iconBase: SVGProps<SVGSVGElement> = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <rect x='3.5' y='5' width='17' height='15' rx='1.5' />
      <path d='M3.5 9.5h17M8 3.5v3M16 3.5v3' />
    </svg>
  )
}

export function IconPin(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <path d='M12 21c4.5-4.2 6.5-7.3 6.5-10.5A6.5 6.5 0 0 0 5.5 10.5C5.5 13.7 7.5 16.8 12 21Z' />
      <circle cx='12' cy='10.3' r='2.2' />
    </svg>
  )
}

export function IconVenue(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <path d='M4 20h16M5.5 20V9.5M18.5 20V9.5M9 20v-4a3 3 0 0 1 6 0v4' />
      <path d='M5.5 9.5 12 4l6.5 5.5M8.5 9.5a3.5 3.5 0 0 1 7 0' />
    </svg>
  )
}

export function IconGlass(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <path d='M6 4h12l-5 7v7m-2 0h4M8.5 18.5h7M7 7.5h10' />
    </svg>
  )
}

export function IconRings(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <circle cx='9.5' cy='14' r='5' />
      <circle cx='15' cy='14' r='5' />
      <path d='M11.5 5 9.5 9l-2-4 2-1.6L11.5 5ZM18 5l-2 4-2-4 2-1.6L18 5Z' />
    </svg>
  )
}

export function IconDinner(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <path d='M6 3v7a2 2 0 0 0 4 0V3M8 10v11M18 3c-1.7 0-3 2.2-3 5s1.3 4 3 4M18 12v9' />
    </svg>
  )
}

export function IconMusic(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <path d='M9 18V6l10-2v12' />
      <circle cx='6.5' cy='18' r='2.5' />
      <circle cx='16.5' cy='16' r='2.5' />
    </svg>
  )
}

export function IconCoffee(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <path d='M5 9h13v4a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V9ZM18 10h1.5a2.5 2.5 0 0 1 0 5H18M8 3v2.5M12 3v2.5' />
    </svg>
  )
}

export function IconCar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <path d='M3 13.5 5 8a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5.5M3 13.5h18v4.5h-2.5M3 13.5V18h2.5M5.5 18a1.5 1.5 0 0 0 3 0M15.5 18a1.5 1.5 0 0 0 3 0' />
    </svg>
  )
}

export function IconConcierge(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <path d='M4 18h16M5 18a7 7 0 0 1 14 0M12 8v3M9.5 8h5' />
    </svg>
  )
}

export function IconCompass(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <circle cx='12' cy='12' r='8.5' />
      <path d='m15.5 8.5-2 5-5 2 2-5 5-2Z' />
    </svg>
  )
}

/** Right-pointing arrow used as a thin link affordance. */
export function IconArrow(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <path d='M4 12h15m-5-5 5 5-5 5' />
    </svg>
  )
}

// — Botanical & landmark line illustrations ——————————————————————————

/** A slender botanical sprig, used as a subtle editorial flourish. */
export function BotanicalSprig(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 60 200' aria-hidden='true' {...iconBase} strokeWidth={0.9} {...props}>
      <path d='M30 4C30 60 30 130 30 196' />
      {Array.from({ length: 9 }).map((_, i) => {
        const y = 26 + i * 18
        return (
          <g key={y}>
            <path
              d={`M30 ${y}C18 ${y - 6} 12 ${y - 2} 9 ${y + 6}C18 ${y + 8} 26 ${y + 4} 30 ${y}`}
            />
            <path
              d={`M30 ${y}C42 ${y - 6} 48 ${y - 2} 51 ${y + 6}C42 ${y + 8} 34 ${y + 4} 30 ${y}`}
            />
          </g>
        )
      })}
    </svg>
  )
}

function SketchBridge(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 120 60' aria-hidden='true' {...iconBase} strokeWidth={0.8} {...props}>
      <path d='M2 50h116M20 50V18M100 50V18M20 22c20-12 80-12 80 0' />
      <path d='M20 18v-6M100 18v-6' />
      {Array.from({ length: 11 }).map((_, i) => {
        const x = 24 + i * 7.2
        const t = (x - 60) / 40
        const y = 22 + 12 * t * t
        return <path key={x} d={`M${x} 50V${y}`} />
      })}
    </svg>
  )
}

function SketchMountains(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 120 60' aria-hidden='true' {...iconBase} strokeWidth={0.8} {...props}>
      <path d='M2 52h116' />
      <path d='M10 52 42 16l16 20 14-14 38 30' />
      <path d='M42 16l-7 9 7 5 6-6M86 38l-6 6 6 4 6-5' />
    </svg>
  )
}

function SketchPalms(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 120 60' aria-hidden='true' {...iconBase} strokeWidth={0.8} {...props}>
      <path d='M2 52h116' />
      <path d='M46 52c0-16 1-26 2-32M74 52c0-14-1-24-2-30' />
      <path d='M48 20c-9-7-18-7-24-2M48 20c10-6 19-4 24 2M48 20c-3-10-9-15-17-15M48 20c5-9 13-12 21-9' />
      <path d='M72 22c-8-6-16-6-22-1M72 22c9-5 17-3 21 2M72 22c-2-9-8-13-15-12' />
    </svg>
  )
}

function SketchHacienda(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 120 60' aria-hidden='true' {...iconBase} strokeWidth={0.8} {...props}>
      <path d='M4 52h112M12 52V24h96v28M12 24l8-8h80l8 8' />
      <path d='M52 16V8h16v8M54 8h12' />
      <path d='M28 52V38a4 4 0 0 1 8 0v14M84 52V38a4 4 0 0 1 8 0v14' />
      <path d='M48 52V40a3 3 0 0 1 6 0v12M66 52V40a3 3 0 0 1 6 0v12' />
    </svg>
  )
}

const SKETCHES = [SketchBridge, SketchMountains, SketchPalms, SketchHacienda]

/** Pick a landmark sketch by index, cycling through the set. */
export function LandmarkSketch({ index, ...props }: { index: number } & SVGProps<SVGSVGElement>) {
  const Sketch = SKETCHES[index % SKETCHES.length] ?? SketchHacienda
  return <Sketch {...props} />
}
