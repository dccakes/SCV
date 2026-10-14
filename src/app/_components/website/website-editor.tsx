'use client'

import { Check, Copy, ExternalLink, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  TranslatableInput,
  TranslatableTextarea,
  useEditingLanguage,
} from '~/components/i18n/editing-language'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { api } from '~/trpc/react'

type WebsiteEditorProps = Readonly<{
  publicUrl: string
  initialIntroText: string
  initialHeadline: string
  initialHeadlineAccent: string
  /** Stored Spanish translation of the hero and intro. */
  initialSpanish?: HeroCopy
}>

type HeroCopy = { introText: string; headline: string; headlineAccent: string }

const EMPTY_HERO: HeroCopy = { introText: '', headline: '', headlineAccent: '' }

export function WebsiteEditor({
  initialIntroText,
  initialHeadline,
  initialHeadlineAccent,
  initialSpanish = EMPTY_HERO,
  publicUrl,
}: WebsiteEditorProps) {
  const router = useRouter()
  const { language } = useEditingLanguage()
  const translating = language === 'es'
  const [english, setEnglish] = useState<HeroCopy>({
    introText: initialIntroText,
    headline: initialHeadline,
    headlineAccent: initialHeadlineAccent,
  })
  const [spanish, setSpanish] = useState<HeroCopy>(initialSpanish)
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify({ en: english, es: initialSpanish })
  )
  const current = translating ? spanish : english
  const { introText, headline, headlineAccent } = current
  const setField = (key: keyof HeroCopy, value: string) =>
    (translating ? setSpanish : setEnglish)((copy) => ({ ...copy, [key]: value }))
  const [copied, setCopied] = useState(false)
  const copyResetTimeoutRef = useRef<number | null>(null)
  const updateHomeSection = api.websiteSection.updateHomeSection.useMutation({
    onError: () => {
      toast.error('Unable to save your website intro.')
    },
    onSuccess: () => {
      toast.success('Hero & intro saved')
      setBaseline(JSON.stringify({ en: english, es: spanish }))
      router.refresh()
    },
  })

  useEffect(() => {
    if (!copied) {
      return
    }

    copyResetTimeoutRef.current = window.setTimeout(() => setCopied(false), 1500)

    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current)
      }
    }
  }, [copied])

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast.success('Public link copied')
    } catch {
      toast.error('Unable to copy the public link.')
    }
  }

  const hasChanges = baseline !== JSON.stringify({ en: english, es: spanish })

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasChanges || updateHomeSection.isPending) {
        return
      }

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges, updateHomeSection.isPending])

  const saveIntro = () => {
    const toContent = (copy: HeroCopy) => ({
      introText: copy.introText,
      headline: copy.headline.trim() ? copy.headline : undefined,
      headlineAccent: copy.headlineAccent.trim() ? copy.headlineAccent : undefined,
    })
    updateHomeSection.mutate({
      ...toContent(english),
      translations: { es: toContent(spanish) },
    })
  }

  return (
    <div className='space-y-6'>
      <Card className='border-border/80 bg-card/80'>
        <CardHeader className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div className='space-y-3'>
            <p className='font-mono text-[0.62rem] text-foreground/45 uppercase tracking-[0.18em]'>
              Wedding Website
            </p>
            <CardTitle className='font-serif text-3xl text-foreground'>
              Shape the first section of your guest-facing site.
            </CardTitle>
            <p className='max-w-2xl font-sans text-muted-foreground text-sm leading-6'>
              The hero headline and intro text guests see when they first open your public wedding
              page.
            </p>
          </div>
          <div className='flex flex-col gap-2 self-start'>
            <Button className='justify-between gap-3' onClick={() => void copyPublicUrl()}>
              {copied ? (
                <Check aria-hidden='true' className='h-4 w-4' />
              ) : (
                <Copy aria-hidden='true' className='h-4 w-4' />
              )}
              {copied ? 'Copied link' : 'Copy public link'}
            </Button>
            <Button asChild variant='outline'>
              <a href={publicUrl} rel='noreferrer' target='_blank'>
                <ExternalLink aria-hidden='true' className='h-4 w-4' />
                Open public site
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='rounded-[8px] border border-border/80 bg-background/70 px-4 py-3'>
            <p className='font-mono text-[0.58rem] text-foreground/45 uppercase tracking-[0.18em]'>
              Public URL
            </p>
            <p className='mt-2 break-all font-mono text-[0.72rem] text-foreground'>{publicUrl}</p>
          </div>
          <div className='grid gap-4 sm:grid-cols-[2fr_1fr]'>
            <div className='space-y-2'>
              <label
                className='font-mono text-[0.62rem] text-foreground/55 uppercase tracking-[0.18em]'
                htmlFor='website-hero-headline'
              >
                Hero Headline
              </label>
              <TranslatableTextarea
                reference={english.headline}
                id='website-hero-headline'
                maxLength={160}
                name='headline'
                rows={3}
                onChange={(event) => setField('headline', event.target.value)}
                placeholder={'Our Greatest\nAdventure\nBegins'}
                value={headline}
              />
              <p className='font-sans text-muted-foreground text-sm leading-6'>
                The large headline shown over your main hero image. Each line break starts a new
                line. Leave blank to use the template default.
              </p>
            </div>
            <div className='space-y-2'>
              <label
                className='font-mono text-[0.62rem] text-foreground/55 uppercase tracking-[0.18em]'
                htmlFor='website-hero-accent'
              >
                Emphasis
              </label>
              <TranslatableInput
                reference={english.headlineAccent}
                id='website-hero-accent'
                maxLength={40}
                name='headlineAccent'
                onChange={(event) => setField('headlineAccent', event.target.value)}
                placeholder='Here.'
                value={headlineAccent}
              />
              <p className='font-sans text-muted-foreground text-sm leading-6'>
                An optional final word rendered in italic accent colour (e.g. “Here.”).
              </p>
            </div>
          </div>
          <div className='space-y-2'>
            <label
              className='font-mono text-[0.62rem] text-foreground/55 uppercase tracking-[0.18em]'
              htmlFor='website-intro-text'
            >
              Home Intro
            </label>
            <TranslatableTextarea
              reference={english.introText}
              id='website-intro-text'
              maxLength={2000}
              name='introText'
              onChange={(event) => setField('introText', event.target.value)}
              placeholder='Welcome guests with a short introduction, weekend note, or practical overview…'
              value={introText}
            />
            <div className='flex items-center justify-between gap-3'>
              <p className='font-sans text-muted-foreground text-sm'>
                Keep it concise. This copy appears beneath the existing public website content.
              </p>
              <span className='font-mono text-[0.62rem] text-foreground/45 tracking-[0.14em]'>
                {introText.length}/2000
              </span>
            </div>
          </div>
          <div className='flex items-center justify-between gap-4 rounded-[8px] border border-border/80 border-dashed bg-muted/20 px-4 py-3'>
            <div className='flex items-start gap-3'>
              <Info aria-hidden='true' className='mt-0.5 h-4 w-4 text-foreground/55' />
              <p className='font-sans text-muted-foreground text-sm leading-6'>
                Only the hero and intro are saved here. Use the Sections card below to add your
                story, travel info, registry links, and more.
              </p>
            </div>
            <Button disabled={!hasChanges || updateHomeSection.isPending} onClick={saveIntro}>
              {updateHomeSection.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
