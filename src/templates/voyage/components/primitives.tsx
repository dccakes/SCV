/**
 * Voyage shared primitives
 *
 * The bespoke editorial vocabulary used across every Voyage surface: eyebrow
 * labels, champagne rules, buttons with wide tracking, and a set of thin-line
 * SVG icons and botanical/landmark illustrations drawn by hand (stroke =
 * currentColor) so they inherit champagne gold and never look stock.
 *
 * Colour tokens (kept literal so Tailwind's JIT can see them):
 *   ivory #F7F3EC · paper #FBF8F2 · cream #EFE7DA · border #DDD2C0
 *   gold #B9965B · gold-light #D3BD8A · bronze #8A6A3E
 *   charcoal #1D2320 · charcoal-soft #2B302C · text #252525 · muted #6F675D
 *   text-light #F7F3EC
 */

import Link from 'next/link'
import type { ReactNode, SVGProps } from 'react'

export const headingFont = 'font-[family-name:var(--tpl-heading-font)]'
export const bodyFont = 'font-[family-name:var(--tpl-body-font)]'
export const labelFont = 'font-[family-name:var(--tpl-label-font)]'

/** The editorial section heading: display serif, light weight, soft-black, responsive. */
export const sectionHeadingClass = `${headingFont} font-light text-4xl text-[#1D2320] sm:text-5xl`

/** Small uppercase, wide-tracked terracotta label sitting above a heading. */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`${labelFont} text-[#B15C41] text-[0.62rem] uppercase tracking-[0.42em] ${className}`}
    >
      {children}
    </span>
  )
}

/** A thin champagne rule. */
export function GoldRule({ className = '' }: { className?: string }) {
  return <span className={`block h-px w-14 bg-[#C9A87F]/70 ${className}`} aria-hidden='true' />
}

/** A centered rule with a small terracotta heart node — the design's romantic divider. */
export function HeartRule({ className = '' }: { className?: string }) {
  return (
    <span
      className={`flex items-center justify-center gap-3 text-[#B15C41] ${className}`}
      aria-hidden='true'
    >
      <span className='block h-px w-10 bg-[#C9A87F]/70' />
      <IconHeart className='h-3.5 w-3.5' />
      <span className='block h-px w-10 bg-[#C9A87F]/70' />
    </span>
  )
}

type ButtonProps = {
  href: string
  children: ReactNode
  external?: boolean
  className?: string
}

const buttonBase = `${labelFont} inline-flex items-center justify-center gap-2 text-[0.68rem] uppercase tracking-[0.28em] transition-colors duration-300`

/** Terracotta-filled primary action. */
export function PrimaryButton({ href, children, external, className = '' }: ButtonProps) {
  const cls = `${buttonBase} rounded-[2px] bg-[#B15C41] px-8 py-3.5 text-[#F7F3EC] hover:bg-[#92462F] ${className}`
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
  const cls = `${buttonBase} rounded-[2px] border border-[#1D2320]/35 px-8 py-3.5 text-[#1D2320] hover:border-[#1D2320] ${className}`
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
      className={`${buttonBase} rounded-[2px] border border-[#F7F3EC]/40 px-8 py-3.5 text-[#F7F3EC] hover:border-[#F7F3EC] hover:bg-[#F7F3EC]/10 ${className}`}
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

export function IconHeart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <path d='M12 20s-7-4.4-9.2-8.5C1.3 8.3 2.7 5 6 5c2 0 3.2 1.2 4 2.4C10.8 6.2 12 5 14 5c3.3 0 4.7 3.3 3.2 6.5C19 15.6 12 20 12 20Z' />
    </svg>
  )
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

/** A confetti / disco-ball style mark for the after-party. */
export function IconSparkle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <circle cx='12' cy='13' r='6' />
      <path d='M12 3v3M12 7l4 4M12 7l-4 4M6 13h12M8.5 8.5l7 9M15.5 8.5l-7 9' />
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

export function IconPlane(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <path d='M10.5 3.2c.5-.9 1.5-.9 2 0l1 6.6 6.7 3.6c.6.3.8.8.6 1.4-.2.5-.7.7-1.3.6l-6-1.1-.5 4 1.8 1.6c.3.3.3.7 0 .9l-.4.2-2.9-1.2-2.9 1.2-.4-.2c-.3-.2-.3-.6 0-.9l1.8-1.6-.5-4-6 1.1c-.6.1-1.1-.1-1.3-.6-.2-.6 0-1.1.6-1.4l6.7-3.6 1-6.6Z' />
    </svg>
  )
}

export function IconBed(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <path d='M3 8v11M3 12h18v7M21 12v-1.5a2.5 2.5 0 0 0-2.5-2.5H9v4M6.5 10.5a1.5 1.5 0 1 0 0-.01' />
    </svg>
  )
}

export function IconCamera(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <rect x='3' y='7' width='18' height='13' rx='2' />
      <path d='M8.5 7 10 4.5h4L15.5 7' />
      <circle cx='12' cy='13.5' r='3.3' />
    </svg>
  )
}

// — Destination highlight marks —————————————————————————————————————

/** A colonial archway — "colonial beauty". */
export function IconArch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <path d='M5 21V10a7 7 0 0 1 14 0v11M5 21h14M9 21v-9a3 3 0 0 1 6 0v9' />
    </svg>
  )
}

/** A ferris wheel — "rich culture". */
export function IconFerris(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <circle cx='12' cy='11' r='7.5' />
      <circle cx='12' cy='11' r='2' />
      <path d='M12 3.5v3M12 15.5v3M4.5 11h3M16.5 11h3M6.7 5.7l2.1 2.1M15.2 13.2l2.1 2.1M17.3 5.7l-2.1 2.1M8.8 13.2l-2.1 2.1M9 21h6' />
    </svg>
  )
}

/** Fork & spoon — "incredible cuisine". */
export function IconCuisine(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <path d='M7 3v6a2 2 0 0 0 4 0V3M9 9v12M17 3c-1.5 0-2.5 2-2.5 4.5S15.5 12 17 12M17 12v9' />
    </svg>
  )
}

/** A rosette / ribbon — "warm hospitality". */
export function IconRosette(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <circle cx='12' cy='9' r='5' />
      <circle cx='12' cy='9' r='2' />
      <path d='M9.5 13.3 8 21l4-2 4 2-1.5-7.7' />
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

/** A thin plus, used as an accordion affordance. */
export function IconPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...iconBase} {...props}>
      <path d='M12 5v14M5 12h14' />
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

/** A wider botanical branch with roses, used to frame section corners. */
export function BotanicalBranch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 200 200' aria-hidden='true' {...iconBase} strokeWidth={0.8} {...props}>
      <path d='M10 190C60 170 110 120 150 60C165 38 178 24 192 14' />
      {(
        [
          [150, 60],
          [110, 118],
          [66, 158],
        ] as const
      ).map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r='9' />
          <path
            d={`M${cx} ${cy - 9}C${cx - 6} ${cy - 4} ${cx - 6} ${cy + 4} ${cx} ${cy + 9}C${cx + 6} ${cy + 4} ${cx + 6} ${cy - 4} ${cx} ${cy - 9}`}
          />
        </g>
      ))}
      {(
        [
          [128, 92],
          [88, 138],
        ] as const
      ).map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x} ${y}C${x - 14} ${y - 8} ${x - 20} ${y - 2} ${x - 22} ${y + 8}C${x - 10} ${y + 8} ${x - 2} ${y + 6} ${x} ${y}`}
        />
      ))}
    </svg>
  )
}

// — Watercolour-style floral accents ————————————————————————————————
// Colored (not currentColor) so they read like the reference's blush roses and
// sage foliage. Control visibility with opacity utilities at the call site.

const BLUSH_OUTER = '#E7C4BB'
const BLUSH_INNER = '#D89E92'
const ROSE_CORE = '#B15C41'
const PETAL_STROKE = '#C88A81'
const LEAF_FILL = '#AEBB9E'
const LEAF_STROKE = '#8B9B7C'

/** A single stylised rose built from two rings of petals around a terracotta core. */
function Rose({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const petals = [0, 72, 144, 216, 288]
  return (
    <g>
      {petals.map((deg) => (
        <ellipse
          key={`o-${deg}`}
          cx={cx}
          cy={cy - r * 0.6}
          rx={r * 0.6}
          ry={r * 0.46}
          transform={`rotate(${deg} ${cx} ${cy})`}
          fill={BLUSH_OUTER}
          stroke={PETAL_STROKE}
          strokeWidth='0.8'
        />
      ))}
      {petals.map((deg) => (
        <ellipse
          key={`i-${deg}`}
          cx={cx}
          cy={cy - r * 0.32}
          rx={r * 0.4}
          ry={r * 0.3}
          transform={`rotate(${deg + 36} ${cx} ${cy})`}
          fill={BLUSH_INNER}
          stroke={PETAL_STROKE}
          strokeWidth='0.6'
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.28} fill={ROSE_CORE} />
    </g>
  )
}

/** A single almond leaf, positioned and rotated. */
function Leaf({ x, y, deg, s = 1 }: { x: number; y: number; deg: number; s?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${deg}) scale(${s})`}
      d='M0 0C10 -6 12 -20 0 -30C-12 -20 -10 -6 0 0Z'
      fill={LEAF_FILL}
      stroke={LEAF_STROKE}
      strokeWidth='0.8'
    />
  )
}

/** A small teardrop bud on a short stem. */
function Bud({ x, y, deg = 0 }: { x: number; y: number; deg?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${deg})`}>
      <path
        d='M0 0C7 0 11 6 11 15S7 30 0 30-11 24-11 15 -7 0 0 0Z'
        fill={BLUSH_INNER}
        stroke={PETAL_STROKE}
        strokeWidth='0.8'
      />
      <path d='M0 0V-8' stroke={LEAF_STROKE} strokeWidth='1' fill='none' />
    </g>
  )
}

/**
 * A tall floral spray with a curving stem, foliage and three roses — used to
 * frame the vertical edges of editorial sections, echoing the reference art.
 */
export function FloralSpray(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 200 480' aria-hidden='true' {...props}>
      <path
        d='M104 476C70 396 150 322 108 244C78 188 140 128 100 40'
        fill='none'
        stroke={LEAF_STROKE}
        strokeWidth='2'
      />
      <Leaf x={112} y={372} deg={38} s={1.5} />
      <Leaf x={84} y={312} deg={-42} s={1.4} />
      <Leaf x={132} y={258} deg={58} s={1.6} />
      <Leaf x={80} y={196} deg={-58} s={1.5} />
      <Leaf x={124} y={132} deg={44} s={1.3} />
      <Leaf x={78} y={92} deg={-30} s={1.2} />
      <Bud x={150} y={150} deg={22} />
      <Rose cx={78} cy={344} r={22} />
      <Rose cx={130} cy={214} r={26} />
      <Rose cx={98} cy={74} r={32} />
    </svg>
  )
}

/**
 * A compact floral cluster for section corners: a rose, a bud and a few leaves.
 */
export function FloralCorner(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 160 140' aria-hidden='true' {...props}>
      <path d='M8 132C48 120 96 92 140 40' fill='none' stroke={LEAF_STROKE} strokeWidth='1.6' />
      <Leaf x={44} y={116} deg={120} s={1.2} />
      <Leaf x={78} y={94} deg={95} s={1.3} />
      <Leaf x={116} y={62} deg={70} s={1.2} />
      <Bud x={132} y={44} deg={130} />
      <Rose cx={40} cy={110} r={16} />
      <Rose cx={92} cy={70} r={22} />
    </svg>
  )
}

/** The hacienda landmark, used as the hero card seal and around the RSVP band. */
export function HaciendaSketch(props: SVGProps<SVGSVGElement>) {
  return <SketchHacienda {...props} />
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
