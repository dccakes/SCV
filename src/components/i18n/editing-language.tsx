'use client'

import { createContext, type ReactNode, useContext, useState } from 'react'

import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import type { Locale } from '~/lib/locale/locale-detection'
import { cn } from '~/lib/utils'

/**
 * The language the couple is currently editing on the website page. English is
 * the source content; Spanish is a translation layered on top of it, so rows,
 * photos and links are managed in English and only text is edited in Spanish.
 */
export type EditingLanguage = Locale

type EditingLanguageContextValue = {
  language: EditingLanguage
  setLanguage: (language: EditingLanguage) => void
}

const EditingLanguageContext = createContext<EditingLanguageContextValue>({
  language: 'en',
  setLanguage: () => undefined,
})

export function EditingLanguageProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [language, setLanguage] = useState<EditingLanguage>('en')
  return (
    <EditingLanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </EditingLanguageContext.Provider>
  )
}

export function useEditingLanguage(): EditingLanguageContextValue {
  return useContext(EditingLanguageContext)
}

/** True while the couple is editing the Spanish translation. */
export function useIsTranslating(): boolean {
  return useEditingLanguage().language === 'es'
}

const LANGUAGES: ReadonlyArray<{ value: EditingLanguage; label: string; name: string }> = [
  { value: 'en', label: 'EN', name: 'English' },
  { value: 'es', label: 'ES', name: 'Spanish' },
]

/** Two-option EN / ES segmented control. */
export function LanguageSwitch({
  value,
  onChange,
  label = 'Editing language',
}: Readonly<{
  value: EditingLanguage
  onChange: (language: EditingLanguage) => void
  label?: string
}>) {
  return (
    <div
      role='radiogroup'
      aria-label={label}
      className='inline-flex shrink-0 self-start rounded-[8px] border border-border/80 bg-background p-0.5'
    >
      {LANGUAGES.map((option) => {
        const selected = option.value === value
        return (
          // biome-ignore lint/a11y/useSemanticElements: a two-option segmented control reads better as buttons than radio inputs
          <button
            key={option.value}
            type='button'
            role='radio'
            aria-checked={selected}
            aria-label={option.name}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-[6px] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] transition-colors',
              selected
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/** EN / ES switch shown above the website editors. */
export function EditingLanguageToggle({ className }: Readonly<{ className?: string }>) {
  const { language, setLanguage } = useEditingLanguage()

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-[10px] border border-border/80 bg-card/95 px-4 py-3 md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      <div className='space-y-1'>
        <p className='font-mono text-[0.6rem] text-foreground/55 uppercase tracking-[0.18em]'>
          Editing language
        </p>
        <p className='font-sans text-muted-foreground text-sm leading-6'>
          {language === 'es'
            ? 'Editing the Spanish version. Blank boxes fall back to your English text. Rows, photos and links are managed in English.'
            : 'Editing the English version. Switch to ES to translate your text for Spanish-speaking guests.'}
        </p>
      </div>
      <LanguageSwitch value={language} onChange={setLanguage} />
    </div>
  )
}

type ReferenceProps = {
  /**
   * The English text this box translates. Passed only while translating; it is
   * shown as the placeholder and beneath the box so the couple can see what to
   * translate. Blank Spanish boxes fall back to it on the guest site.
   */
  reference?: string | null
  /** Shared across languages (links): locked while translating. */
  shared?: boolean
}

export function ReferenceNote({ reference }: Readonly<{ reference: string }>) {
  return (
    <p className='line-clamp-3 whitespace-pre-line font-sans text-muted-foreground text-xs leading-5'>
      <span className='font-mono text-[0.58rem] text-foreground/45 uppercase tracking-[0.18em]'>
        EN ·{' '}
      </span>
      {reference}
    </p>
  )
}

type TranslatableControlProps<P> = Readonly<
  P & ReferenceProps & { placeholder?: string; disabled?: boolean }
>

/**
 * Wrap a text control so it edits English normally and, while translating,
 * edits the Spanish copy with the English shown as placeholder and note.
 * Shared controls (links) are locked while translating.
 */
function translatable<P extends object>(Control: React.ComponentType<P & { lang?: string }>) {
  return function Translatable({ reference, shared, ...props }: TranslatableControlProps<P>) {
    const translating = useIsTranslating()
    const controlProps = props as P & { placeholder?: string; disabled?: boolean }
    if (!translating) return <Control {...controlProps} />
    if (shared) return <Control {...controlProps} disabled title='Edit links in English' />
    const english = reference?.trim() ? reference : undefined
    return (
      <div className='w-full space-y-1'>
        <Control {...controlProps} lang='es' placeholder={english ?? controlProps.placeholder} />
        {english ? <ReferenceNote reference={english} /> : null}
      </div>
    )
  }
}

/** Input that edits English, or the Spanish translation with the English as reference. */
export const TranslatableInput = translatable<React.ComponentProps<typeof Input>>(Input)

/** Textarea that edits English, or the Spanish translation with the English as reference. */
export const TranslatableTextarea = translatable<React.ComponentProps<typeof Textarea>>(Textarea)

/**
 * Header row for dialogs that edit one item in both languages: a hint and the
 * EN / ES switch.
 */
export function LanguageSwitchHeader({
  value,
  onChange,
  label,
  englishHint,
}: Readonly<{
  value: EditingLanguage
  onChange: (language: EditingLanguage) => void
  label: string
  /** Shown while editing English, e.g. "Switch to ES to translate this question." */
  englishHint: string
}>) {
  return (
    <div className='flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between'>
      <p className='text-muted-foreground text-xs'>
        {value === 'es'
          ? 'Spanish text for Spanish-speaking guests. Blank fields show the English.'
          : englishHint}
      </p>
      <LanguageSwitch value={value} onChange={onChange} label={label} />
    </div>
  )
}
