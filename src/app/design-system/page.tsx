'use client'

import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'

const colorTokens = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--border',
  '--input',
  '--ring',
] as const

const textColorTokens = [
  '--foreground',
  '--muted-foreground',
  '--primary',
  '--primary-foreground',
  '--accent',
  '--accent-foreground',
  '--sidebar-ink',
  '--sidebar-cream',
  '--etta-ink',
] as const

type ThemePreviewProps = {
  title: string
  description: string
  testId: string
  darkMode?: boolean
}

const rgbToHex = (channel: number): string => {
  return Math.max(0, Math.min(255, channel)).toString(16).padStart(2, '0').toUpperCase()
}

const colorStringToHex = (colorValue: string): string | null => {
  const normalized = colorValue.trim()

  if (!normalized) return null

  const hexMatch = normalized.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
  if (hexMatch) {
    const hex = hexMatch[1] ?? ''
    if (hex.length === 3) {
      return `#${hex
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
        .toUpperCase()}`
    }
    return `#${hex.toUpperCase()}`
  }

  const rgbMatch = normalized.match(
    /^rgba?\(\s*(\d{1,3})\s*[ ,]\s*(\d{1,3})\s*[ ,]\s*(\d{1,3})(?:\s*[,/]\s*(\d*\.?\d+%?))?\s*\)$/i
  )

  if (!rgbMatch) return null

  const [, redRaw = '', greenRaw = '', blueRaw = '', alphaRaw] = rgbMatch
  const red = Number.parseInt(redRaw, 10)
  const green = Number.parseInt(greenRaw, 10)
  const blue = Number.parseInt(blueRaw, 10)

  if (!alphaRaw) {
    return `#${rgbToHex(red)}${rgbToHex(green)}${rgbToHex(blue)}`
  }

  const alpha = alphaRaw.endsWith('%')
    ? Number.parseFloat(alphaRaw) / 100
    : Number.parseFloat(alphaRaw)

  if (Number.isNaN(alpha) || alpha >= 0.999) {
    return `#${rgbToHex(red)}${rgbToHex(green)}${rgbToHex(blue)}`
  }

  const alphaChannel = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
  return `#${rgbToHex(red)}${rgbToHex(green)}${rgbToHex(blue)}${rgbToHex(alphaChannel)}`
}

function TokenSwatch({ tokenName }: Readonly<{ tokenName: (typeof colorTokens)[number] }>) {
  const swatchRef = useRef<HTMLDivElement>(null)
  const [hexColor, setHexColor] = useState<string>('resolving...')

  const swatchStyle = {
    backgroundColor: `var(${tokenName})`,
  } satisfies CSSProperties

  useEffect(() => {
    const swatchElement = swatchRef.current
    if (!swatchElement) return

    const computedBackgroundColor = window.getComputedStyle(swatchElement).backgroundColor
    const resolvedHex = colorStringToHex(computedBackgroundColor)
    setHexColor(resolvedHex ?? computedBackgroundColor ?? 'unresolved')
  }, [])

  return (
    <div className='rounded-md border border-border/80 bg-card p-3'>
      <div
        ref={swatchRef}
        className='h-16 rounded-sm border border-border/70'
        style={swatchStyle}
      />
      <p className='mt-2 font-mono text-[0.68rem] text-foreground tracking-wide'>{tokenName}</p>
      <p className='mt-1 font-mono text-[0.62rem] text-muted-foreground'>Hex: {hexColor}</p>
    </div>
  )
}

function TextTokenSwatch({ tokenName }: Readonly<{ tokenName: (typeof textColorTokens)[number] }>) {
  const textRef = useRef<HTMLParagraphElement>(null)
  const [hexColor, setHexColor] = useState<string>('resolving...')

  const textStyle = {
    color: `var(${tokenName})`,
  } satisfies CSSProperties

  useEffect(() => {
    const textElement = textRef.current
    if (!textElement) return

    const computedColor = window.getComputedStyle(textElement).color
    const resolvedHex = colorStringToHex(computedColor)
    setHexColor(resolvedHex ?? computedColor ?? 'unresolved')
  }, [])

  return (
    <div className='rounded-md border border-border/80 bg-card p-3'>
      <div className='rounded-sm border border-border/70 bg-background p-3'>
        <p ref={textRef} className='font-semibold text-sm' style={textStyle}>
          Sample text
        </p>
      </div>
      <p className='mt-2 font-mono text-[0.68rem] text-foreground tracking-wide'>{tokenName}</p>
      <p className='mt-1 font-mono text-[0.62rem] text-muted-foreground'>Hex: {hexColor}</p>
    </div>
  )
}

function ThemePreview(props: Readonly<ThemePreviewProps>) {
  const content = (
    <section className='rounded-lg border border-border bg-background p-4'>
      <h2 className='font-semibold text-foreground text-lg'>{props.title}</h2>
      <p className='mt-1 text-muted-foreground text-sm'>{props.description}</p>
      <p className='mt-4 font-mono text-[0.62rem] text-muted-foreground uppercase tracking-wide'>
        Surface colors
      </p>
      <div className='mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5'>
        {colorTokens.map((tokenName) => (
          <TokenSwatch key={`${props.testId}-${tokenName}`} tokenName={tokenName} />
        ))}
      </div>
      <p className='mt-5 font-mono text-[0.62rem] text-muted-foreground uppercase tracking-wide'>
        Text colors
      </p>
      <div className='mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5'>
        {textColorTokens.map((tokenName) => (
          <TextTokenSwatch key={`${props.testId}-text-${tokenName}`} tokenName={tokenName} />
        ))}
      </div>
    </section>
  )

  if (!props.darkMode) {
    return <div data-testid={props.testId}>{content}</div>
  }

  return (
    <div className='dark' data-testid={props.testId}>
      {content}
    </div>
  )
}

export default function DesignSystemPage() {
  return (
    <main className='design-system-print min-h-screen bg-background px-4 py-6 md:px-6 md:py-8 lg:px-8'>
      <style>{`
        @media print {
          .design-system-print,
          .design-system-print * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-6'>
        <header>
          <h1 className='text-2xl text-foreground md:text-3xl'>Design System</h1>
          <p className='mt-2 max-w-3xl text-muted-foreground text-sm md:text-base'>
            Quick visual reference for existing light and dark color tokens. Use this page to pick
            tokens before styling updates.
          </p>
          <p className='mt-2 text-muted-foreground text-xs md:text-sm'>
            PDF tip: Enable background graphics in your browser print dialog so swatch colors are
            preserved.
          </p>
          <p className='mt-2 text-muted-foreground text-xs md:text-sm'>
            Route-specific themes are currently disabled; this page shows the single app-wide
            default theme only.
          </p>
        </header>

        <ThemePreview
          title='Default Theme (Light)'
          description='Current :root variables applied globally.'
          testId='theme-default-light'
        />

        <ThemePreview
          title='Default Theme (Dark)'
          description='Current .dark variables applied globally.'
          testId='theme-default-dark'
          darkMode
        />
      </div>
    </main>
  )
}
