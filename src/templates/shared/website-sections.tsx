/**
 * WebsiteSections
 *
 * Renders the couple's enabled content sections. It is shared by every template
 * and styled entirely with semantic theme tokens (`text-foreground`,
 * `text-primary`, `bg-card`, the `--tpl-heading-font` variable, …), so it
 * automatically takes on each template's palette and typography. Templates that
 * want a bespoke section look can render their own instead.
 */

import type {
  FaqSectionContent,
  OurStorySectionContent,
  RegistrySectionContent,
  TravelSectionContent,
  WebsiteSection,
  WeddingPartySectionContent,
} from '~/server/domains/website-section/website-section.types'

const headingClass =
  'font-[family-name:var(--tpl-heading-font)] text-4xl text-foreground tracking-wide'

const anchorId = (type: string) => type.toLowerCase().replace(/_/g, '-')

/** Render a multi-line string as separate paragraphs. */
function Prose({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return null
  }

  return (
    <div className='space-y-4 text-balance text-lg text-muted-foreground leading-8'>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  )
}

function SectionShell({
  id,
  heading,
  children,
}: {
  id: string
  heading: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className='flex w-full max-w-3xl flex-col items-center gap-8 text-center'>
      <h2 className={headingClass}>{heading}</h2>
      {children}
    </section>
  )
}

function OurStory({ content }: { content: OurStorySectionContent }) {
  return (
    <SectionShell id={anchorId('OUR_STORY')} heading={content.heading}>
      <Prose text={content.body} />
    </SectionShell>
  )
}

function WeddingParty({ content }: { content: WeddingPartySectionContent }) {
  if (content.members.length === 0) {
    return null
  }

  return (
    <SectionShell id={anchorId('WEDDING_PARTY')} heading={content.heading}>
      <div className='grid w-full gap-6 sm:grid-cols-2 md:grid-cols-3'>
        {content.members.map((member) => (
          <div
            key={`${member.name}-${member.role}`}
            className='flex flex-col items-center gap-1 rounded-[16px] border border-border bg-card px-6 py-8 text-card-foreground'
          >
            <p className='font-[family-name:var(--tpl-heading-font)] text-2xl text-foreground'>
              {member.name}
            </p>
            <p className='text-muted-foreground text-sm uppercase tracking-[0.2em]'>
              {member.role}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

function Travel({ content }: { content: TravelSectionContent }) {
  return (
    <SectionShell id={anchorId('TRAVEL')} heading={content.heading}>
      <Prose text={content.body} />
    </SectionShell>
  )
}

function Faq({ content }: { content: FaqSectionContent }) {
  if (content.items.length === 0) {
    return null
  }

  return (
    <SectionShell id={anchorId('FAQ')} heading={content.heading}>
      <dl className='w-full space-y-6 text-left'>
        {content.items.map((item) => (
          <div key={item.question} className='border-border border-b pb-5'>
            <dt className='text-foreground text-lg'>{item.question}</dt>
            <dd className='mt-2 text-muted-foreground leading-7'>{item.answer}</dd>
          </div>
        ))}
      </dl>
    </SectionShell>
  )
}

function Registry({ content }: { content: RegistrySectionContent }) {
  return (
    <SectionShell id={anchorId('REGISTRY')} heading={content.heading}>
      <Prose text={content.body} />
      {content.links.length > 0 && (
        <div className='flex flex-wrap items-center justify-center gap-3'>
          {content.links.map((link) => (
            <a
              key={`${link.label}-${link.url}`}
              href={link.url}
              target='_blank'
              rel='noreferrer'
              className='rounded-full border border-primary px-6 py-2.5 text-[0.72rem] text-primary uppercase tracking-[0.25em] transition-colors hover:bg-primary hover:text-primary-foreground'
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

function SectionRenderer({ section }: { section: WebsiteSection }) {
  switch (section.type) {
    case 'OUR_STORY':
      return <OurStory content={section.content} />
    case 'WEDDING_PARTY':
      return <WeddingParty content={section.content} />
    case 'TRAVEL':
      return <Travel content={section.content} />
    case 'FAQ':
      return <Faq content={section.content} />
    case 'REGISTRY':
      return <Registry content={section.content} />
    default:
      // HOME is rendered as the hero intro by each template, not here.
      return null
  }
}

export function WebsiteSections({ sections }: { sections: WebsiteSection[] }) {
  if (sections.length === 0) {
    return null
  }

  return (
    <>
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </>
  )
}
