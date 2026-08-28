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

import Image from 'next/image'
import type {
  DestinationSectionContent,
  ExperiencesSectionContent,
  FaqSectionContent,
  OurStorySectionContent,
  RegistrySectionContent,
  TimelineSectionContent,
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
  const services = content.services ?? []
  const stays = content.stays ?? []
  return (
    <SectionShell id='travel' eyebrow='Getting There' heading={content.heading}>
      <ProseBlock text={content.body} />
      {services.length > 0 ? (
        <div className='grid w-full max-w-3xl gap-4 sm:grid-cols-3'>
          {services.map((service) => (
            <div
              key={`${service.title}`}
              className='rounded-[16px] border border-border bg-card px-5 py-5 text-center'
            >
              <p className='text-foreground text-sm uppercase tracking-[0.18em]'>{service.title}</p>
              <p className='mt-2 text-muted-foreground text-sm leading-6'>{service.description}</p>
            </div>
          ))}
        </div>
      ) : null}
      {stays.length > 0 ? (
        <div className='grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {stays.map((stay) => (
            <article
              key={`${stay.name}`}
              className='flex flex-col overflow-hidden rounded-[20px] border border-border bg-card'
            >
              {stay.imageUrl ? (
                <div className='relative aspect-[4/3] w-full'>
                  <Image
                    src={stay.imageUrl}
                    fill
                    sizes='(max-width: 768px) 50vw, 33vw'
                    className='object-cover'
                    alt={stay.name}
                  />
                </div>
              ) : null}
              <div className='flex flex-col gap-1 px-5 py-4 text-center'>
                <p className={`${headingFont} text-foreground text-xl`}>{stay.name}</p>
                {stay.description ? (
                  <p className='text-muted-foreground text-sm leading-6'>{stay.description}</p>
                ) : null}
                {stay.url ? (
                  <a
                    href={stay.url}
                    target='_blank'
                    rel='noreferrer'
                    className='mt-1 text-[0.7rem] text-primary uppercase tracking-[0.2em] underline-offset-4 hover:underline'
                  >
                    View
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
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
            className='flex flex-col items-center gap-2 rounded-[20px] border border-border bg-card px-6 py-8 text-card-foreground'
          >
            {member.imageUrl ? (
              <div className='relative mb-1 h-28 w-28 overflow-hidden rounded-full border border-border'>
                <Image
                  src={member.imageUrl}
                  fill
                  sizes='112px'
                  className='object-cover'
                  alt={member.name}
                />
              </div>
            ) : null}
            <p className={`${headingFont} text-2xl text-foreground`}>{member.name}</p>
            <p className='text-muted-foreground text-sm uppercase tracking-[0.2em]'>
              {member.role}
            </p>
            {member.blurb ? (
              <p className='text-muted-foreground text-sm leading-6'>{member.blurb}</p>
            ) : null}
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

function Timeline({ content }: { content: TimelineSectionContent }) {
  if (content.milestones.length === 0) {
    return null
  }
  return (
    <SectionShell id='our-story' eyebrow={content.eyebrow ?? 'Our Story'} heading={content.heading}>
      <ol className='grid w-full gap-8 sm:grid-cols-2 lg:grid-cols-4'>
        {content.milestones.map((milestone) => (
          <li
            key={`${milestone.year}-${milestone.title}`}
            className='flex flex-col items-center gap-1.5 rounded-[20px] border border-border bg-card px-6 py-7 text-center'
          >
            <span className={`${headingFont} text-3xl text-primary italic`}>{milestone.year}</span>
            <span className='text-foreground text-sm uppercase tracking-[0.2em]'>
              {milestone.title}
            </span>
            {milestone.location ? (
              <span className='text-muted-foreground text-sm'>{milestone.location}</span>
            ) : null}
          </li>
        ))}
      </ol>
    </SectionShell>
  )
}

function Destination({ content }: { content: DestinationSectionContent }) {
  if (!content.body.trim() && !content.imageUrl) {
    return null
  }
  return (
    <SectionShell
      id='destination'
      eyebrow={content.eyebrow ?? 'The Destination'}
      heading={content.heading}
    >
      {content.imageUrl ? (
        <div className='relative h-72 w-full max-w-3xl overflow-hidden rounded-[20px] border border-border'>
          <Image
            src={content.imageUrl}
            fill
            sizes='(max-width: 768px) 100vw, 70vw'
            className='object-cover'
            alt={content.venueName ?? content.heading}
          />
        </div>
      ) : null}
      {content.location ? (
        <p className={`${headingFont} text-2xl text-primary italic`}>{content.location}</p>
      ) : null}
      <ProseBlock text={content.body} />
      {content.venueName ? (
        <p className='text-foreground text-sm uppercase tracking-[0.2em]'>{content.venueName}</p>
      ) : null}
      {content.ctaLabel && content.ctaUrl ? (
        <a
          href={content.ctaUrl}
          target='_blank'
          rel='noreferrer'
          className='rounded-full border border-primary px-6 py-2.5 text-[0.72rem] text-primary uppercase tracking-[0.25em] transition-colors hover:bg-primary hover:text-primary-foreground'
        >
          {content.ctaLabel}
        </a>
      ) : null}
    </SectionShell>
  )
}

function Experiences({ content }: { content: ExperiencesSectionContent }) {
  if (content.items.length === 0) {
    return null
  }
  return (
    <SectionShell
      id='experiences'
      eyebrow={content.eyebrow ?? 'Curated Experiences'}
      heading={content.heading}
    >
      <div className='grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {content.items.map((item) => (
          <article
            key={`${item.title}`}
            className='flex flex-col overflow-hidden rounded-[20px] border border-border bg-card'
          >
            {item.imageUrl ? (
              <div className='relative aspect-[4/5] w-full'>
                <Image
                  src={item.imageUrl}
                  fill
                  sizes='(max-width: 768px) 50vw, 25vw'
                  className='object-cover'
                  alt={item.title}
                />
              </div>
            ) : null}
            <div className='flex flex-col gap-1 px-5 py-5 text-center'>
              <h3 className={`${headingFont} text-2xl text-foreground italic`}>{item.title}</h3>
              {item.description ? (
                <p className='text-muted-foreground text-sm leading-6'>{item.description}</p>
              ) : null}
            </div>
          </article>
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
    case 'TIMELINE':
      return <Timeline content={section.content} />
    case 'DESTINATION':
      return <Destination content={section.content} />
    case 'EXPERIENCES':
      return <Experiences content={section.content} />
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
