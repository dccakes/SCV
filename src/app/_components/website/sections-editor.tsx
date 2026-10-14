'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { SingleImageUpload } from '~/app/_components/website/image-upload'
import {
  TranslatableInput,
  TranslatableTextarea,
  useEditingLanguage,
  useIsTranslating,
} from '~/components/i18n/editing-language'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Switch } from '~/components/ui/switch'
import { alignTranslation, syncRemovedItems } from '~/lib/i18n/translations'
import {
  SECTION_CATALOG,
  type SectionCatalogEntry,
} from '~/server/domains/website-section/website-section.catalog'
import type {
  DestinationSectionContent,
  ExperiencesSectionContent,
  FaqSectionContent,
  InvitationSectionContent,
  OurStorySectionContent,
  RegistrySectionContent,
  SaveTheDateSectionContent,
  TimelineSectionContent,
  TravelSectionContent,
  WebsiteSection,
  WebsiteSectionContent,
  WebsiteSectionType,
  WeddingPartySectionContent,
} from '~/server/domains/website-section/website-section.types'
import { api } from '~/trpc/react'

type SectionsEditorProps = Readonly<{
  initialSections: WebsiteSection[]
}>

const labelClass = 'font-mono text-[0.6rem] text-foreground/55 uppercase tracking-[0.18em]'

/** Return a copy of `items` with the item at `index` patched on a single key. */
function updateAt<T, K extends keyof T>(items: T[], index: number, key: K, value: T[K]): T[] {
  return items.map((item, i) => (i === index ? { ...item, [key]: value } : item))
}

/** Editable section types — HOME is handled by the Welcome editor. */
const EDITABLE_SECTIONS = SECTION_CATALOG.filter((entry) => entry.type !== 'HOME')

export function SectionsEditor({ initialSections }: SectionsEditorProps) {
  const byType = new Map(initialSections.map((section) => [section.type, section]))

  return (
    <Card className='border-border/80 bg-card/80'>
      <CardHeader className='space-y-2'>
        <p className={labelClass}>Sections</p>
        <h3 className='font-serif text-2xl text-foreground'>Build out your wedding website</h3>
        <p className='max-w-2xl font-sans text-muted-foreground text-sm leading-6'>
          Add the sections guests care about. Each one is styled automatically by your selected
          template. Enable a section to publish it on your public page.
        </p>
      </CardHeader>
      <CardContent className='space-y-4'>
        {EDITABLE_SECTIONS.map((entry) => {
          const existing = byType.get(entry.type)
          return (
            <SectionCard
              key={entry.type}
              entry={entry}
              initialContent={(existing?.content as WebsiteSectionContent) ?? entry.defaultContent}
              initialSpanish={existing?.translations?.es as WebsiteSectionContent | undefined}
              initialEnabled={existing?.isEnabled ?? entry.defaultEnabled}
            />
          )
        })}
      </CardContent>
    </Card>
  )
}

type SectionCardProps = {
  entry: SectionCatalogEntry
  initialContent: WebsiteSectionContent
  /** Stored Spanish translation, if any. */
  initialSpanish?: WebsiteSectionContent
  initialEnabled: boolean
}

function SectionCard({ entry, initialContent, initialSpanish, initialEnabled }: SectionCardProps) {
  const router = useRouter()
  const { language } = useEditingLanguage()
  const [content, setContent] = useState<WebsiteSectionContent>(initialContent)
  // Spanish is kept shaped like the English content: same rows, same links/photos.
  const [spanish, setSpanish] = useState<WebsiteSectionContent>(() =>
    alignTranslation(initialContent, initialSpanish)
  )
  const [isEnabled, setIsEnabled] = useState(initialEnabled)
  // Spanish is compared aligned to the English rows, the way it is saved.
  const snapshot = (
    en: WebsiteSectionContent,
    alignedEs: WebsiteSectionContent,
    enabled: boolean
  ) => JSON.stringify({ en, es: alignedEs, enabled })
  const [baseline, setBaseline] = useState(() => snapshot(initialContent, spanish, initialEnabled))
  const alignedSpanish = alignTranslation(content, spanish)

  const changeContent = (next: WebsiteSectionContent) => {
    if (language === 'es') {
      setSpanish(next)
      return
    }
    // Removing an English row removes its translation too, so rows stay paired.
    setSpanish((current) => syncRemovedItems(content, next, current))
    setContent(next)
  }

  const upsertSection = api.websiteSection.upsertSection.useMutation({
    onError: (error) => {
      toast.error(error.message || `Unable to save the ${entry.label} section.`)
    },
    onSuccess: () => {
      toast.success(`${entry.label} saved`)
      setBaseline(snapshot(content, alignedSpanish, isEnabled))
      router.refresh()
    },
  })

  const hasChanges = baseline !== snapshot(content, alignedSpanish, isEnabled)

  const save = () => {
    upsertSection.mutate({
      type: entry.type,
      content,
      isEnabled,
      translations: { es: alignedSpanish },
    })
  }

  return (
    <div className='space-y-4 rounded-[10px] border border-border/80 bg-background/60 p-4'>
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-1'>
          <p className='font-serif text-foreground text-lg'>{entry.label}</p>
          <p className='font-sans text-muted-foreground text-sm leading-6'>{entry.description}</p>
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <span className={labelClass}>{isEnabled ? 'On' : 'Off'}</span>
          <Switch
            aria-label={`Enable ${entry.label} section`}
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>
      </div>

      <SectionFields
        type={entry.type}
        content={language === 'es' ? alignedSpanish : content}
        reference={language === 'es' ? content : undefined}
        onChange={changeContent}
      />

      <div className='flex justify-end'>
        <Button disabled={!hasChanges || upsertSection.isPending} onClick={save} size='sm'>
          {upsertSection.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

type SectionFieldsProps = {
  type: WebsiteSectionType
  content: WebsiteSectionContent
  /** English content, passed while editing the Spanish translation. */
  reference?: WebsiteSectionContent
  onChange: (content: WebsiteSectionContent) => void
}

function SectionFields({ type, content, reference, onChange }: SectionFieldsProps) {
  switch (type) {
    case 'OUR_STORY':
      return (
        <ProseFields
          content={content as OurStorySectionContent}
          reference={reference as OurStorySectionContent | undefined}
          onChange={onChange}
        />
      )
    case 'TIMELINE':
      return (
        <TimelineFields
          content={content as TimelineSectionContent}
          reference={reference as TimelineSectionContent | undefined}
          onChange={onChange}
        />
      )
    case 'DESTINATION':
      return (
        <DestinationFields
          content={content as DestinationSectionContent}
          reference={reference as DestinationSectionContent | undefined}
          onChange={onChange}
        />
      )
    case 'EXPERIENCES':
      return (
        <ExperiencesFields
          content={content as ExperiencesSectionContent}
          reference={reference as ExperiencesSectionContent | undefined}
          onChange={onChange}
        />
      )
    case 'TRAVEL':
      return (
        <TravelFields
          content={content as TravelSectionContent}
          reference={reference as TravelSectionContent | undefined}
          onChange={onChange}
        />
      )
    case 'WEDDING_PARTY':
      return (
        <WeddingPartyFields
          content={content as WeddingPartySectionContent}
          reference={reference as WeddingPartySectionContent | undefined}
          onChange={onChange}
        />
      )
    case 'FAQ':
      return (
        <FaqFields
          content={content as FaqSectionContent}
          reference={reference as FaqSectionContent | undefined}
          onChange={onChange}
        />
      )
    case 'REGISTRY':
      return (
        <RegistryFields
          content={content as RegistrySectionContent}
          reference={reference as RegistrySectionContent | undefined}
          onChange={onChange}
        />
      )
    case 'SAVE_THE_DATE':
      return (
        <SaveTheDateFields
          content={content as SaveTheDateSectionContent}
          reference={reference as SaveTheDateSectionContent | undefined}
          onChange={onChange}
        />
      )
    case 'INVITATION':
      return (
        <InvitationFields
          content={content as InvitationSectionContent}
          reference={reference as InvitationSectionContent | undefined}
          onChange={onChange}
        />
      )
    default:
      return null
  }
}

function HeadingField({
  value,
  onChange,
  reference,
}: {
  value: string
  onChange: (heading: string) => void
  reference?: string
}) {
  return (
    <div className='space-y-1.5'>
      <span className={labelClass}>Heading</span>
      <TranslatableInput
        maxLength={120}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder='Section heading'
        reference={reference}
      />
    </div>
  )
}

function ProseFields({
  content,
  onChange,
  reference,
}: {
  content: OurStorySectionContent
  onChange: (content: WebsiteSectionContent) => void
  /** English content, passed while translating. */
  reference?: OurStorySectionContent
}) {
  return (
    <div className='space-y-3'>
      <HeadingField
        value={content.heading}
        reference={reference?.heading}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <div className='space-y-1.5'>
        <span className={labelClass}>Body</span>
        <TranslatableTextarea
          maxLength={4000}
          rows={5}
          value={content.body}
          onChange={(event) => onChange({ ...content, body: event.target.value })}
          placeholder='Write a few paragraphs. Separate paragraphs with a blank line.'
          reference={reference?.body}
        />
      </div>
    </div>
  )
}

function WeddingPartyFields({
  content,
  onChange,
  reference,
}: {
  content: WeddingPartySectionContent
  onChange: (content: WebsiteSectionContent) => void
  /** English content, passed while translating. */
  reference?: WeddingPartySectionContent
}) {
  const updateMember = (
    index: number,
    key: 'name' | 'role' | 'imageUrl' | 'blurb',
    value: string | undefined
  ) => {
    onChange({ ...content, members: updateAt(content.members, index, key, value) })
  }

  return (
    <div className='space-y-3'>
      <HeadingField
        value={content.heading}
        reference={reference?.heading}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <div className='space-y-3'>
        {content.members.map((member, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional editable rows; field values are controlled by state
            key={index}
            className='space-y-2 rounded-[8px] border border-border/70 p-3'
          >
            <div className='flex items-center gap-2'>
              <TranslatableInput
                value={member.name}
                maxLength={120}
                placeholder='Name'
                onChange={(event) => updateMember(index, 'name', event.target.value)}
                reference={reference?.members?.[index]?.name}
              />
              <TranslatableInput
                value={member.role}
                maxLength={120}
                placeholder='Role (e.g. Maid of Honor)'
                onChange={(event) => updateMember(index, 'role', event.target.value)}
                reference={reference?.members?.[index]?.role}
              />
              <RemoveRowButton
                label='Remove member'
                onClick={() =>
                  onChange({
                    ...content,
                    members: content.members.filter((_, i) => i !== index),
                  })
                }
              />
            </div>
            <div className='space-y-1.5'>
              <span className={labelClass}>Photo (optional)</span>
              <SharedImageUpload
                value={member.imageUrl ?? null}
                onChange={(url) => updateMember(index, 'imageUrl', url ?? undefined)}
                aspectClassName='aspect-square max-w-[8rem]'
                label='Add photo'
              />
            </div>
            <TranslatableTextarea
              value={member.blurb ?? ''}
              maxLength={1000}
              rows={3}
              placeholder='A short blurb about them and their relationship to the couple (optional)'
              onChange={(event) => updateMember(index, 'blurb', event.target.value || undefined)}
              reference={reference?.members?.[index]?.blurb}
            />
          </div>
        ))}
      </div>
      <AddRowButton
        label='Add member'
        disabled={content.members.length >= 30}
        onClick={() =>
          onChange({ ...content, members: [...content.members, { name: '', role: '' }] })
        }
      />
    </div>
  )
}

function FaqFields({
  content,
  onChange,
  reference,
}: {
  content: FaqSectionContent
  onChange: (content: WebsiteSectionContent) => void
  /** English content, passed while translating. */
  reference?: FaqSectionContent
}) {
  const updateItem = (index: number, key: 'question' | 'answer', value: string) => {
    onChange({ ...content, items: updateAt(content.items, index, key, value) })
  }

  return (
    <div className='space-y-3'>
      <HeadingField
        value={content.heading}
        reference={reference?.heading}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <div className='space-y-3'>
        {content.items.map((item, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional editable rows; field values are controlled by state
            key={index}
            className='space-y-2 rounded-[8px] border border-border/70 p-3'
          >
            <div className='flex items-center gap-2'>
              <TranslatableInput
                value={item.question}
                maxLength={300}
                placeholder='Question'
                onChange={(event) => updateItem(index, 'question', event.target.value)}
                reference={reference?.items?.[index]?.question}
              />
              <RemoveRowButton
                label='Remove question'
                onClick={() =>
                  onChange({ ...content, items: content.items.filter((_, i) => i !== index) })
                }
              />
            </div>
            <TranslatableTextarea
              value={item.answer}
              maxLength={2000}
              rows={2}
              placeholder='Answer'
              onChange={(event) => updateItem(index, 'answer', event.target.value)}
              reference={reference?.items?.[index]?.answer}
            />
          </div>
        ))}
      </div>
      <AddRowButton
        label='Add question'
        disabled={content.items.length >= 30}
        onClick={() =>
          onChange({ ...content, items: [...content.items, { question: '', answer: '' }] })
        }
      />
    </div>
  )
}

function RegistryFields({
  content,
  onChange,
  reference,
}: {
  content: RegistrySectionContent
  onChange: (content: WebsiteSectionContent) => void
  /** English content, passed while translating. */
  reference?: RegistrySectionContent
}) {
  const updateLink = (index: number, key: 'label' | 'url', value: string) => {
    onChange({ ...content, links: updateAt(content.links, index, key, value) })
  }

  return (
    <div className='space-y-3'>
      <HeadingField
        value={content.heading}
        reference={reference?.heading}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <div className='space-y-1.5'>
        <span className={labelClass}>Note</span>
        <TranslatableTextarea
          maxLength={2000}
          rows={3}
          value={content.body}
          onChange={(event) => onChange({ ...content, body: event.target.value })}
          placeholder='A short note about gifts or registries.'
          reference={reference?.body}
        />
      </div>
      <div className='space-y-2'>
        {content.links.map((link, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional editable rows; field values are controlled by state
            key={index}
            className='flex items-center gap-2'
          >
            <TranslatableInput
              value={link.label}
              maxLength={120}
              placeholder='Label (e.g. Amazon)'
              onChange={(event) => updateLink(index, 'label', event.target.value)}
              reference={reference?.links?.[index]?.label}
            />
            <TranslatableInput
              value={link.url}
              maxLength={500}
              placeholder='https://…'
              onChange={(event) => updateLink(index, 'url', event.target.value)}
              shared
            />
            <RemoveRowButton
              label='Remove link'
              onClick={() =>
                onChange({ ...content, links: content.links.filter((_, i) => i !== index) })
              }
            />
          </div>
        ))}
      </div>
      <AddRowButton
        label='Add link'
        disabled={content.links.length >= 20}
        onClick={() => onChange({ ...content, links: [...content.links, { label: '', url: '' }] })}
      />
    </div>
  )
}

function TextField({
  label,
  value,
  placeholder,
  maxLength,
  onChange,
  reference,
  shared,
}: {
  label: string
  value: string
  placeholder?: string
  maxLength?: number
  onChange: (value: string) => void
  /** English text, passed while translating. */
  reference?: string
  /** Same in every language (links): locked while translating. */
  shared?: boolean
}) {
  return (
    <div className='space-y-1.5'>
      <span className={labelClass}>{label}</span>
      <TranslatableInput
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        reference={reference}
        shared={shared}
      />
    </div>
  )
}

function TimelineFields({
  content,
  onChange,
  reference,
}: {
  content: TimelineSectionContent
  onChange: (content: WebsiteSectionContent) => void
  /** English content, passed while translating. */
  reference?: TimelineSectionContent
}) {
  const updateMilestone = (
    index: number,
    key: 'year' | 'title' | 'location',
    value: string | undefined
  ) => {
    onChange({ ...content, milestones: updateAt(content.milestones, index, key, value) })
  }

  return (
    <div className='space-y-3'>
      <TextField
        label='Eyebrow (optional)'
        reference={reference?.eyebrow}
        value={content.eyebrow ?? ''}
        maxLength={60}
        placeholder='Our Story'
        onChange={(eyebrow) => onChange({ ...content, eyebrow: eyebrow || undefined })}
      />
      <HeadingField
        value={content.heading}
        reference={reference?.heading}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <div className='space-y-3'>
        {content.milestones.map((milestone, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional editable rows; field values are controlled by state
            key={index}
            className='flex items-center gap-2 rounded-[8px] border border-border/70 p-3'
          >
            <TranslatableInput
              value={milestone.year}
              maxLength={40}
              placeholder='2018'
              className='max-w-[6rem]'
              onChange={(event) => updateMilestone(index, 'year', event.target.value)}
              reference={reference?.milestones?.[index]?.year}
            />
            <TranslatableInput
              value={milestone.title}
              maxLength={120}
              placeholder='First Meeting'
              onChange={(event) => updateMilestone(index, 'title', event.target.value)}
              reference={reference?.milestones?.[index]?.title}
            />
            <TranslatableInput
              value={milestone.location ?? ''}
              maxLength={120}
              placeholder='New York, USA'
              onChange={(event) =>
                updateMilestone(index, 'location', event.target.value || undefined)
              }
              reference={reference?.milestones?.[index]?.location}
            />
            <RemoveRowButton
              label='Remove milestone'
              onClick={() =>
                onChange({
                  ...content,
                  milestones: content.milestones.filter((_, i) => i !== index),
                })
              }
            />
          </div>
        ))}
      </div>
      <AddRowButton
        label='Add milestone'
        disabled={content.milestones.length >= 12}
        onClick={() =>
          onChange({
            ...content,
            milestones: [...content.milestones, { year: '', title: '' }],
          })
        }
      />
    </div>
  )
}

function DestinationFields({
  content,
  onChange,
  reference,
}: {
  content: DestinationSectionContent
  onChange: (content: WebsiteSectionContent) => void
  /** English content, passed while translating. */
  reference?: DestinationSectionContent
}) {
  return (
    <div className='space-y-3'>
      <TextField
        label='Eyebrow (optional)'
        reference={reference?.eyebrow}
        value={content.eyebrow ?? ''}
        maxLength={60}
        placeholder='The Destination'
        onChange={(eyebrow) => onChange({ ...content, eyebrow: eyebrow || undefined })}
      />
      <HeadingField
        value={content.heading}
        reference={reference?.heading}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <div className='space-y-1.5'>
        <span className={labelClass}>Description</span>
        <TranslatableTextarea
          maxLength={2000}
          rows={4}
          value={content.body}
          onChange={(event) => onChange({ ...content, body: event.target.value })}
          placeholder='A few lines about the city, culture, and why you chose it.'
          reference={reference?.body}
        />
      </div>
      <TextField
        label='Location (optional)'
        reference={reference?.location}
        value={content.location ?? ''}
        maxLength={120}
        placeholder='Puebla, Mexico'
        onChange={(location) => onChange({ ...content, location: location || undefined })}
      />
      <TextField
        label='Venue name (optional)'
        reference={reference?.venueName}
        value={content.venueName ?? ''}
        maxLength={160}
        placeholder='Hacienda San José Actipan'
        onChange={(venueName) => onChange({ ...content, venueName: venueName || undefined })}
      />
      <TextField
        label='Venue note (optional)'
        reference={reference?.venueNote}
        value={content.venueNote ?? ''}
        maxLength={200}
        placeholder='Historic charm & exclusive experience.'
        onChange={(venueNote) => onChange({ ...content, venueNote: venueNote || undefined })}
      />
      <div className='flex gap-2'>
        <TextField
          label='Button label (optional)'
          reference={reference?.ctaLabel}
          value={content.ctaLabel ?? ''}
          maxLength={60}
          placeholder='Discover Puebla'
          onChange={(ctaLabel) => onChange({ ...content, ctaLabel: ctaLabel || undefined })}
        />
        <TextField
          label='Button URL (optional)'
          shared
          value={content.ctaUrl ?? ''}
          maxLength={1000}
          placeholder='https://…'
          onChange={(ctaUrl) => onChange({ ...content, ctaUrl: ctaUrl || undefined })}
        />
      </div>
      <div className='space-y-1.5'>
        <span className={labelClass}>Feature image (optional)</span>
        <SharedImageUpload
          value={content.imageUrl ?? null}
          onChange={(url) => onChange({ ...content, imageUrl: url ?? undefined })}
          aspectClassName='aspect-[4/3] max-w-[18rem]'
          label='Add image'
        />
      </div>
    </div>
  )
}

function ExperiencesFields({
  content,
  onChange,
  reference,
}: {
  content: ExperiencesSectionContent
  onChange: (content: WebsiteSectionContent) => void
  /** English content, passed while translating. */
  reference?: ExperiencesSectionContent
}) {
  const updateItem = (
    index: number,
    key: 'title' | 'description' | 'imageUrl',
    value: string | undefined
  ) => {
    onChange({ ...content, items: updateAt(content.items, index, key, value) })
  }

  return (
    <div className='space-y-3'>
      <TextField
        label='Eyebrow (optional)'
        reference={reference?.eyebrow}
        value={content.eyebrow ?? ''}
        maxLength={60}
        placeholder='Curated Experiences'
        onChange={(eyebrow) => onChange({ ...content, eyebrow: eyebrow || undefined })}
      />
      <HeadingField
        value={content.heading}
        reference={reference?.heading}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <div className='space-y-3'>
        {content.items.map((item, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional editable rows; field values are controlled by state
            key={index}
            className='space-y-2 rounded-[8px] border border-border/70 p-3'
          >
            <div className='flex items-center gap-2'>
              <TranslatableInput
                value={item.title}
                maxLength={120}
                placeholder='The Ceremony'
                onChange={(event) => updateItem(index, 'title', event.target.value)}
                reference={reference?.items?.[index]?.title}
              />
              <RemoveRowButton
                label='Remove experience'
                onClick={() =>
                  onChange({ ...content, items: content.items.filter((_, i) => i !== index) })
                }
              />
            </div>
            <TranslatableInput
              value={item.description ?? ''}
              maxLength={300}
              placeholder='A moment we’ll never forget'
              onChange={(event) =>
                updateItem(index, 'description', event.target.value || undefined)
              }
              reference={reference?.items?.[index]?.description}
            />
            <div className='space-y-1.5'>
              <span className={labelClass}>Image (optional)</span>
              <SharedImageUpload
                value={item.imageUrl ?? null}
                onChange={(url) => updateItem(index, 'imageUrl', url ?? undefined)}
                aspectClassName='aspect-[4/3] max-w-[12rem]'
                label='Add image'
              />
            </div>
          </div>
        ))}
      </div>
      <AddRowButton
        label='Add experience'
        disabled={content.items.length >= 12}
        onClick={() => onChange({ ...content, items: [...content.items, { title: '' }] })}
      />
    </div>
  )
}

function TravelFields({
  content,
  onChange,
  reference,
}: {
  content: TravelSectionContent
  onChange: (content: WebsiteSectionContent) => void
  /** English content, passed while translating. */
  reference?: TravelSectionContent
}) {
  const services = content.services ?? []
  const stays = content.stays ?? []

  const updateService = (index: number, key: 'title' | 'description', value: string) => {
    onChange({ ...content, services: updateAt(services, index, key, value) })
  }

  const updateStay = (
    index: number,
    key: 'name' | 'description' | 'imageUrl' | 'url' | 'blurb' | 'buttonLabel',
    value: string | undefined
  ) => {
    onChange({ ...content, stays: updateAt(stays, index, key, value) })
  }

  return (
    <div className='space-y-3'>
      <HeadingField
        value={content.heading}
        reference={reference?.heading}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <div className='space-y-1.5'>
        <span className={labelClass}>Intro</span>
        <TranslatableTextarea
          maxLength={4000}
          rows={4}
          value={content.body}
          onChange={(event) => onChange({ ...content, body: event.target.value })}
          placeholder='Travel notes for guests. Separate paragraphs with a blank line.'
          reference={reference?.body}
        />
      </div>

      <div className='space-y-2'>
        <span className={labelClass}>Services (optional)</span>
        {services.map((service, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional editable rows; field values are controlled by state
            key={index}
            className='flex items-center gap-2'
          >
            <TranslatableInput
              value={service.title}
              maxLength={120}
              placeholder='Private Transfers'
              className='max-w-[12rem]'
              onChange={(event) => updateService(index, 'title', event.target.value)}
              reference={reference?.services?.[index]?.title}
            />
            <TranslatableInput
              value={service.description}
              maxLength={300}
              placeholder='Airport transfers throughout the weekend.'
              onChange={(event) => updateService(index, 'description', event.target.value)}
              reference={reference?.services?.[index]?.description}
            />
            <RemoveRowButton
              label='Remove service'
              onClick={() =>
                onChange({ ...content, services: services.filter((_, i) => i !== index) })
              }
            />
          </div>
        ))}
        <AddRowButton
          label='Add service'
          disabled={services.length >= 8}
          onClick={() =>
            onChange({ ...content, services: [...services, { title: '', description: '' }] })
          }
        />
      </div>

      <div className='space-y-2'>
        <span className={labelClass}>Recommended stays (optional)</span>
        {stays.map((stay, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional editable rows; field values are controlled by state
            key={index}
            className='space-y-2 rounded-[8px] border border-border/70 p-3'
          >
            <div className='flex items-center gap-2'>
              <TranslatableInput
                value={stay.name}
                maxLength={160}
                placeholder='Quinta Real Puebla'
                onChange={(event) => updateStay(index, 'name', event.target.value)}
                reference={reference?.stays?.[index]?.name}
              />
              <RemoveRowButton
                label='Remove stay'
                onClick={() => onChange({ ...content, stays: stays.filter((_, i) => i !== index) })}
              />
            </div>
            <TranslatableInput
              value={stay.description ?? ''}
              maxLength={300}
              placeholder='Colonial elegance & modern comfort'
              onChange={(event) =>
                updateStay(index, 'description', event.target.value || undefined)
              }
              reference={reference?.stays?.[index]?.description}
            />
            <div className='space-y-1.5'>
              <span className={labelClass}>Photo (optional)</span>
              <SharedImageUpload
                value={stay.imageUrl ?? null}
                onChange={(url) => updateStay(index, 'imageUrl', url ?? undefined)}
                aspectClassName='aspect-[4/3] max-w-[12rem]'
                label='Add photo'
              />
            </div>
            <TranslatableTextarea
              value={stay.blurb ?? ''}
              maxLength={1000}
              rows={3}
              placeholder='A longer blurb shown when guests click the card, e.g. why you recommend this stay (optional)'
              onChange={(event) => updateStay(index, 'blurb', event.target.value || undefined)}
              reference={reference?.stays?.[index]?.blurb}
            />
            <div className='flex items-center gap-2'>
              <TranslatableInput
                value={stay.url ?? ''}
                maxLength={1000}
                placeholder='https://…'
                onChange={(event) => updateStay(index, 'url', event.target.value || undefined)}
                shared
              />
              <TranslatableInput
                value={stay.buttonLabel ?? ''}
                maxLength={60}
                placeholder='Button text (e.g. Visit Website)'
                onChange={(event) =>
                  updateStay(index, 'buttonLabel', event.target.value || undefined)
                }
                reference={reference?.stays?.[index]?.buttonLabel}
              />
            </div>
          </div>
        ))}
        <AddRowButton
          label='Add stay'
          disabled={stays.length >= 8}
          onClick={() => onChange({ ...content, stays: [...stays, { name: '' }] })}
        />
      </div>
    </div>
  )
}

function SaveTheDateFields({
  content,
  onChange,
  reference,
}: {
  content: SaveTheDateSectionContent
  onChange: (content: WebsiteSectionContent) => void
  /** English content, passed while translating. */
  reference?: SaveTheDateSectionContent
}) {
  return (
    <div className='space-y-3'>
      <TextField
        label='Label (optional)'
        reference={reference?.eyebrow}
        value={content.eyebrow ?? ''}
        maxLength={60}
        placeholder='Save the Date'
        onChange={(eyebrow) => onChange({ ...content, eyebrow: eyebrow || undefined })}
      />
      <div className='space-y-1.5'>
        <span className={labelClass}>Message (optional)</span>
        <TranslatableTextarea
          maxLength={600}
          rows={3}
          value={content.message ?? ''}
          onChange={(event) => onChange({ ...content, message: event.target.value || undefined })}
          placeholder="A short note to your guests, e.g. “We can't wait to celebrate with you.”"
          reference={reference?.message}
        />
      </div>
      <TextField
        label='Footnote (optional)'
        reference={reference?.footnote}
        value={content.footnote ?? ''}
        maxLength={160}
        placeholder='Formal invitation to follow.'
        onChange={(footnote) => onChange({ ...content, footnote: footnote || undefined })}
      />
    </div>
  )
}

function InvitationFields({
  content,
  onChange,
  reference,
}: {
  content: InvitationSectionContent
  onChange: (content: WebsiteSectionContent) => void
  /** English content, passed while translating. */
  reference?: InvitationSectionContent
}) {
  return (
    <div className='space-y-3'>
      <TextField
        label='Opening line (optional)'
        reference={reference?.preface}
        value={content.preface ?? ''}
        maxLength={160}
        placeholder='Together with their families'
        onChange={(preface) => onChange({ ...content, preface: preface || undefined })}
      />
      <TextField
        label='Invitation line (optional)'
        reference={reference?.invitationLine}
        value={content.invitationLine ?? ''}
        maxLength={200}
        placeholder='request the pleasure of your company'
        onChange={(invitationLine) =>
          onChange({ ...content, invitationLine: invitationLine || undefined })
        }
      />
      <div className='space-y-1.5'>
        <span className={labelClass}>Message (optional)</span>
        <TranslatableTextarea
          maxLength={600}
          rows={3}
          value={content.message ?? ''}
          onChange={(event) => onChange({ ...content, message: event.target.value || undefined })}
          placeholder='An optional closing note shown above the RSVP button.'
          reference={reference?.message}
        />
      </div>
    </div>
  )
}

function AddRowButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  // Rows are added in English; the Spanish view mirrors them.
  if (useIsTranslating()) return null
  return (
    <Button type='button' variant='outline' size='sm' onClick={onClick} disabled={disabled}>
      <Plus aria-hidden='true' className='h-4 w-4' />
      {label}
    </Button>
  )
}

function RemoveRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  if (useIsTranslating()) return null
  return (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      aria-label={label}
      onClick={onClick}
      className='shrink-0 text-muted-foreground hover:text-destructive'
    >
      <Trash2 aria-hidden='true' className='h-4 w-4' />
    </Button>
  )
}

/** Photos are shared by both languages, so they are only editable in English. */
function SharedImageUpload(props: React.ComponentProps<typeof SingleImageUpload>) {
  const translating = useIsTranslating()
  if (!translating) return <SingleImageUpload {...props} />
  return props.value ? (
    // biome-ignore lint/performance/noImgElement: small read-only preview of an uploaded photo
    <img src={props.value} alt='' className='h-16 w-16 rounded-[6px] object-cover opacity-70' />
  ) : (
    <p className='font-sans text-muted-foreground text-xs'>Add photos in English.</p>
  )
}
