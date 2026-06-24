/**
 * AureliaSections
 *
 * Aurelia's take on the content sections: a structured, card-driven layout with
 * accent eyebrow labels, a multi-column wedding-party grid, bordered FAQ rows,
 * and pill-style registry buttons.
 *
 * Deliberately a *different layout* from Classic's centered, minimal renderer —
 * same data, different page structure — to prove templates own layout, not just
 * theme.
 */

import type {
  FaqSectionContent,
  OurStorySectionContent,
  RegistrySectionContent,
  TravelSectionContent,
  WebsiteSection,
  WeddingPartySectionContent,
} from '~/server/domains/website-section/website-section.types'
import { splitParagraphs } from '~/templates/shared/prose'

const headingFont = 'font-[family-name:var(--tpl-heading-font)]'

function SectionShell({
  id,
  eyebrow,
  heading,
  children,
}: {
  id: string
  eyebrow: string
  heading: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className='flex w-full max-w-4xl flex-col items-center gap-6 text-center'>
      <div className='flex flex-col items-center gap-2'>
        <span className='text-[0.62rem] text-accent uppercase tracking-[0.4em]'>{eyebrow}</span>
        <h2 className={`${headingFont} text-4xl text-foreground italic`}>{heading}</h2>
        <span className='h-px w-12 bg-border' />
      </div>
      {children}
    </section>
  )
}

function ProseBlock({ text }: { text: string }) {
  const paragraphs = splitParagraphs(text)
  if (paragraphs.length === 0) {
    return null
  }
  return (
    <div className='max-w-2xl space-y-4 text-balance text-lg text-muted-foreground leading-9'>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  )
}

function OurStory({ content }: { content: OurStorySectionContent }) {
  return (
    <SectionShell id='our-story' eyebrow='Our Story' heading={content.heading}>
      <ProseBlock text={content.body} />
    </SectionShell>
  )
}

function Travel({ content }: { content: TravelSectionContent }) {
  return (
    <SectionShell id='travel' eyebrow='Getting There' heading={content.heading}>
      <ProseBlock text={content.body} />
    </SectionShell>
  )
}

function WeddingParty({ content }: { content: WeddingPartySectionContent }) {
  if (content.members.length === 0) {
    return null
  }
  return (
    <SectionShell id='wedding-party' eyebrow='By Our Side' heading={content.heading}>
      <div className='grid w-full gap-6 sm:grid-cols-2 md:grid-cols-3'>
        {content.members.map((member) => (
          <div
            key={`${member.name}-${member.role}`}
            className='flex flex-col items-center gap-1 rounded-[20px] border border-border bg-card px-6 py-8 text-card-foreground'
          >
            <p className={`${headingFont} text-2xl text-foreground`}>{member.name}</p>
            <p className='text-muted-foreground text-sm uppercase tracking-[0.2em]'>
              {member.role}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

function Faq({ content }: { content: FaqSectionContent }) {
  if (content.items.length === 0) {
    return null
  }
  return (
    <SectionShell id='faq' eyebrow='Good to Know' heading={content.heading}>
      <dl className='w-full max-w-2xl space-y-4 text-left'>
        {content.items.map((item) => (
          <div
            key={item.question}
            className='rounded-[16px] border border-border bg-card px-6 py-5 text-card-foreground'
          >
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
    <SectionShell id='registry' eyebrow='With Gratitude' heading={content.heading}>
      <ProseBlock text={content.body} />
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
    case 'TRAVEL':
      return <Travel content={section.content} />
    case 'WEDDING_PARTY':
      return <WeddingParty content={section.content} />
    case 'FAQ':
      return <Faq content={section.content} />
    case 'REGISTRY':
      return <Registry content={section.content} />
    default:
      return null
  }
}

export function AureliaSections({ sections }: { sections: WebsiteSection[] }) {
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
