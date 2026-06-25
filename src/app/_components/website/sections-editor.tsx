'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { SingleImageUpload } from '~/app/_components/website/image-upload'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
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
  initialEnabled: boolean
}

function SectionCard({ entry, initialContent, initialEnabled }: SectionCardProps) {
  const router = useRouter()
  const [content, setContent] = useState<WebsiteSectionContent>(initialContent)
  const [isEnabled, setIsEnabled] = useState(initialEnabled)
  const [baseline, setBaseline] = useState(() => JSON.stringify({ initialContent, initialEnabled }))

  const upsertSection = api.websiteSection.upsertSection.useMutation({
    onError: (error) => {
      toast.error(error.message || `Unable to save the ${entry.label} section.`)
    },
    onSuccess: () => {
      toast.success(`${entry.label} saved`)
      setBaseline(JSON.stringify({ initialContent: content, initialEnabled: isEnabled }))
      router.refresh()
    },
  })

  const hasChanges =
    baseline !== JSON.stringify({ initialContent: content, initialEnabled: isEnabled })

  const save = () => {
    upsertSection.mutate({
      type: entry.type,
      content,
      isEnabled,
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

      <SectionFields type={entry.type} content={content} onChange={setContent} />

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
  onChange: (content: WebsiteSectionContent) => void
}

function SectionFields({ type, content, onChange }: SectionFieldsProps) {
  switch (type) {
    case 'OUR_STORY':
      return <ProseFields content={content as OurStorySectionContent} onChange={onChange} />
    case 'TIMELINE':
      return <TimelineFields content={content as TimelineSectionContent} onChange={onChange} />
    case 'DESTINATION':
      return (
        <DestinationFields content={content as DestinationSectionContent} onChange={onChange} />
      )
    case 'EXPERIENCES':
      return (
        <ExperiencesFields content={content as ExperiencesSectionContent} onChange={onChange} />
      )
    case 'TRAVEL':
      return <TravelFields content={content as TravelSectionContent} onChange={onChange} />
    case 'WEDDING_PARTY':
      return (
        <WeddingPartyFields content={content as WeddingPartySectionContent} onChange={onChange} />
      )
    case 'FAQ':
      return <FaqFields content={content as FaqSectionContent} onChange={onChange} />
    case 'REGISTRY':
      return <RegistryFields content={content as RegistrySectionContent} onChange={onChange} />
    case 'SAVE_THE_DATE':
      return (
        <SaveTheDateFields content={content as SaveTheDateSectionContent} onChange={onChange} />
      )
    case 'INVITATION':
      return <InvitationFields content={content as InvitationSectionContent} onChange={onChange} />
    default:
      return null
  }
}

function HeadingField({ value, onChange }: { value: string; onChange: (heading: string) => void }) {
  return (
    <div className='space-y-1.5'>
      <span className={labelClass}>Heading</span>
      <Input
        maxLength={120}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder='Section heading'
      />
    </div>
  )
}

function ProseFields({
  content,
  onChange,
}: {
  content: OurStorySectionContent
  onChange: (content: WebsiteSectionContent) => void
}) {
  return (
    <div className='space-y-3'>
      <HeadingField
        value={content.heading}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <div className='space-y-1.5'>
        <span className={labelClass}>Body</span>
        <Textarea
          maxLength={4000}
          rows={5}
          value={content.body}
          onChange={(event) => onChange({ ...content, body: event.target.value })}
          placeholder='Write a few paragraphs. Separate paragraphs with a blank line.'
        />
      </div>
    </div>
  )
}

function WeddingPartyFields({
  content,
  onChange,
}: {
  content: WeddingPartySectionContent
  onChange: (content: WebsiteSectionContent) => void
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
              <Input
                value={member.name}
                maxLength={120}
                placeholder='Name'
                onChange={(event) => updateMember(index, 'name', event.target.value)}
              />
              <Input
                value={member.role}
                maxLength={120}
                placeholder='Role (e.g. Maid of Honor)'
                onChange={(event) => updateMember(index, 'role', event.target.value)}
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
              <SingleImageUpload
                value={member.imageUrl ?? null}
                onChange={(url) => updateMember(index, 'imageUrl', url ?? undefined)}
                aspectClassName='aspect-square max-w-[8rem]'
                label='Add photo'
              />
            </div>
            <Textarea
              value={member.blurb ?? ''}
              maxLength={1000}
              rows={3}
              placeholder='A short blurb about them and their relationship to the couple (optional)'
              onChange={(event) => updateMember(index, 'blurb', event.target.value || undefined)}
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
}: {
  content: FaqSectionContent
  onChange: (content: WebsiteSectionContent) => void
}) {
  const updateItem = (index: number, key: 'question' | 'answer', value: string) => {
    onChange({ ...content, items: updateAt(content.items, index, key, value) })
  }

  return (
    <div className='space-y-3'>
      <HeadingField
        value={content.heading}
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
              <Input
                value={item.question}
                maxLength={300}
                placeholder='Question'
                onChange={(event) => updateItem(index, 'question', event.target.value)}
              />
              <RemoveRowButton
                label='Remove question'
                onClick={() =>
                  onChange({ ...content, items: content.items.filter((_, i) => i !== index) })
                }
              />
            </div>
            <Textarea
              value={item.answer}
              maxLength={2000}
              rows={2}
              placeholder='Answer'
              onChange={(event) => updateItem(index, 'answer', event.target.value)}
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
}: {
  content: RegistrySectionContent
  onChange: (content: WebsiteSectionContent) => void
}) {
  const updateLink = (index: number, key: 'label' | 'url', value: string) => {
    onChange({ ...content, links: updateAt(content.links, index, key, value) })
  }

  return (
    <div className='space-y-3'>
      <HeadingField
        value={content.heading}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <div className='space-y-1.5'>
        <span className={labelClass}>Note</span>
        <Textarea
          maxLength={2000}
          rows={3}
          value={content.body}
          onChange={(event) => onChange({ ...content, body: event.target.value })}
          placeholder='A short note about gifts or registries.'
        />
      </div>
      <div className='space-y-2'>
        {content.links.map((link, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional editable rows; field values are controlled by state
            key={index}
            className='flex items-center gap-2'
          >
            <Input
              value={link.label}
              maxLength={120}
              placeholder='Label (e.g. Amazon)'
              onChange={(event) => updateLink(index, 'label', event.target.value)}
            />
            <Input
              value={link.url}
              maxLength={500}
              placeholder='https://…'
              onChange={(event) => updateLink(index, 'url', event.target.value)}
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
}: {
  label: string
  value: string
  placeholder?: string
  maxLength?: number
  onChange: (value: string) => void
}) {
  return (
    <div className='space-y-1.5'>
      <span className={labelClass}>{label}</span>
      <Input
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function TimelineFields({
  content,
  onChange,
}: {
  content: TimelineSectionContent
  onChange: (content: WebsiteSectionContent) => void
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
        value={content.eyebrow ?? ''}
        maxLength={60}
        placeholder='Our Story'
        onChange={(eyebrow) => onChange({ ...content, eyebrow: eyebrow || undefined })}
      />
      <HeadingField
        value={content.heading}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <div className='space-y-3'>
        {content.milestones.map((milestone, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional editable rows; field values are controlled by state
            key={index}
            className='flex items-center gap-2 rounded-[8px] border border-border/70 p-3'
          >
            <Input
              value={milestone.year}
              maxLength={40}
              placeholder='2018'
              className='max-w-[6rem]'
              onChange={(event) => updateMilestone(index, 'year', event.target.value)}
            />
            <Input
              value={milestone.title}
              maxLength={120}
              placeholder='First Meeting'
              onChange={(event) => updateMilestone(index, 'title', event.target.value)}
            />
            <Input
              value={milestone.location ?? ''}
              maxLength={120}
              placeholder='New York, USA'
              onChange={(event) =>
                updateMilestone(index, 'location', event.target.value || undefined)
              }
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
}: {
  content: DestinationSectionContent
  onChange: (content: WebsiteSectionContent) => void
}) {
  return (
    <div className='space-y-3'>
      <TextField
        label='Eyebrow (optional)'
        value={content.eyebrow ?? ''}
        maxLength={60}
        placeholder='The Destination'
        onChange={(eyebrow) => onChange({ ...content, eyebrow: eyebrow || undefined })}
      />
      <HeadingField
        value={content.heading}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <div className='space-y-1.5'>
        <span className={labelClass}>Description</span>
        <Textarea
          maxLength={2000}
          rows={4}
          value={content.body}
          onChange={(event) => onChange({ ...content, body: event.target.value })}
          placeholder='A few lines about the city, culture, and why you chose it.'
        />
      </div>
      <TextField
        label='Location (optional)'
        value={content.location ?? ''}
        maxLength={120}
        placeholder='Puebla, Mexico'
        onChange={(location) => onChange({ ...content, location: location || undefined })}
      />
      <TextField
        label='Venue name (optional)'
        value={content.venueName ?? ''}
        maxLength={160}
        placeholder='Hacienda San José Actipan'
        onChange={(venueName) => onChange({ ...content, venueName: venueName || undefined })}
      />
      <TextField
        label='Venue note (optional)'
        value={content.venueNote ?? ''}
        maxLength={200}
        placeholder='Historic charm & exclusive experience.'
        onChange={(venueNote) => onChange({ ...content, venueNote: venueNote || undefined })}
      />
      <div className='flex gap-2'>
        <TextField
          label='Button label (optional)'
          value={content.ctaLabel ?? ''}
          maxLength={60}
          placeholder='Discover Puebla'
          onChange={(ctaLabel) => onChange({ ...content, ctaLabel: ctaLabel || undefined })}
        />
        <TextField
          label='Button URL (optional)'
          value={content.ctaUrl ?? ''}
          maxLength={500}
          placeholder='https://…'
          onChange={(ctaUrl) => onChange({ ...content, ctaUrl: ctaUrl || undefined })}
        />
      </div>
      <div className='space-y-1.5'>
        <span className={labelClass}>Feature image (optional)</span>
        <SingleImageUpload
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
}: {
  content: ExperiencesSectionContent
  onChange: (content: WebsiteSectionContent) => void
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
        value={content.eyebrow ?? ''}
        maxLength={60}
        placeholder='Curated Experiences'
        onChange={(eyebrow) => onChange({ ...content, eyebrow: eyebrow || undefined })}
      />
      <HeadingField
        value={content.heading}
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
              <Input
                value={item.title}
                maxLength={120}
                placeholder='The Ceremony'
                onChange={(event) => updateItem(index, 'title', event.target.value)}
              />
              <RemoveRowButton
                label='Remove experience'
                onClick={() =>
                  onChange({ ...content, items: content.items.filter((_, i) => i !== index) })
                }
              />
            </div>
            <Input
              value={item.description ?? ''}
              maxLength={300}
              placeholder='A moment we’ll never forget'
              onChange={(event) =>
                updateItem(index, 'description', event.target.value || undefined)
              }
            />
            <div className='space-y-1.5'>
              <span className={labelClass}>Image (optional)</span>
              <SingleImageUpload
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
}: {
  content: TravelSectionContent
  onChange: (content: WebsiteSectionContent) => void
}) {
  const services = content.services ?? []
  const stays = content.stays ?? []

  const updateService = (index: number, key: 'title' | 'description', value: string) => {
    onChange({ ...content, services: updateAt(services, index, key, value) })
  }

  const updateStay = (
    index: number,
    key: 'name' | 'description' | 'imageUrl' | 'url',
    value: string | undefined
  ) => {
    onChange({ ...content, stays: updateAt(stays, index, key, value) })
  }

  return (
    <div className='space-y-3'>
      <HeadingField
        value={content.heading}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <div className='space-y-1.5'>
        <span className={labelClass}>Intro</span>
        <Textarea
          maxLength={4000}
          rows={4}
          value={content.body}
          onChange={(event) => onChange({ ...content, body: event.target.value })}
          placeholder='Travel notes for guests. Separate paragraphs with a blank line.'
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
            <Input
              value={service.title}
              maxLength={120}
              placeholder='Private Transfers'
              className='max-w-[12rem]'
              onChange={(event) => updateService(index, 'title', event.target.value)}
            />
            <Input
              value={service.description}
              maxLength={300}
              placeholder='Airport transfers throughout the weekend.'
              onChange={(event) => updateService(index, 'description', event.target.value)}
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
              <Input
                value={stay.name}
                maxLength={160}
                placeholder='Quinta Real Puebla'
                onChange={(event) => updateStay(index, 'name', event.target.value)}
              />
              <RemoveRowButton
                label='Remove stay'
                onClick={() => onChange({ ...content, stays: stays.filter((_, i) => i !== index) })}
              />
            </div>
            <Input
              value={stay.description ?? ''}
              maxLength={300}
              placeholder='Colonial elegance & modern comfort'
              onChange={(event) =>
                updateStay(index, 'description', event.target.value || undefined)
              }
            />
            <Input
              value={stay.url ?? ''}
              maxLength={500}
              placeholder='https://…'
              onChange={(event) => updateStay(index, 'url', event.target.value || undefined)}
            />
            <div className='space-y-1.5'>
              <span className={labelClass}>Photo (optional)</span>
              <SingleImageUpload
                value={stay.imageUrl ?? null}
                onChange={(url) => updateStay(index, 'imageUrl', url ?? undefined)}
                aspectClassName='aspect-[4/3] max-w-[12rem]'
                label='Add photo'
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
}: {
  content: SaveTheDateSectionContent
  onChange: (content: WebsiteSectionContent) => void
}) {
  return (
    <div className='space-y-3'>
      <TextField
        label='Label (optional)'
        value={content.eyebrow ?? ''}
        maxLength={60}
        placeholder='Save the Date'
        onChange={(eyebrow) => onChange({ ...content, eyebrow: eyebrow || undefined })}
      />
      <div className='space-y-1.5'>
        <span className={labelClass}>Message (optional)</span>
        <Textarea
          maxLength={600}
          rows={3}
          value={content.message ?? ''}
          onChange={(event) => onChange({ ...content, message: event.target.value || undefined })}
          placeholder="A short note to your guests, e.g. “We can't wait to celebrate with you.”"
        />
      </div>
      <TextField
        label='Footnote (optional)'
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
}: {
  content: InvitationSectionContent
  onChange: (content: WebsiteSectionContent) => void
}) {
  return (
    <div className='space-y-3'>
      <TextField
        label='Opening line (optional)'
        value={content.preface ?? ''}
        maxLength={160}
        placeholder='Together with their families'
        onChange={(preface) => onChange({ ...content, preface: preface || undefined })}
      />
      <TextField
        label='Invitation line (optional)'
        value={content.invitationLine ?? ''}
        maxLength={200}
        placeholder='request the pleasure of your company'
        onChange={(invitationLine) =>
          onChange({ ...content, invitationLine: invitationLine || undefined })
        }
      />
      <div className='space-y-1.5'>
        <span className={labelClass}>Message (optional)</span>
        <Textarea
          maxLength={600}
          rows={3}
          value={content.message ?? ''}
          onChange={(event) => onChange({ ...content, message: event.target.value || undefined })}
          placeholder='An optional closing note shown above the RSVP button.'
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
  return (
    <Button type='button' variant='outline' size='sm' onClick={onClick} disabled={disabled}>
      <Plus aria-hidden='true' className='h-4 w-4' />
      {label}
    </Button>
  )
}

function RemoveRowButton({ label, onClick }: { label: string; onClick: () => void }) {
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
