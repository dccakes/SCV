/**
 * ClassicSections
 *
 * Classic's take on the content sections: minimalist and centered, mirroring
 * the home page's editorial style — lowercase, letter-spaced headings, thin
 * rules, plain stacked lists, and underlined text links. No cards or grids.
 *
 * This is intentionally a *different layout* from Aurelia's section renderer
 * (not just different colors), so swapping templates restructures the page.
 */

import Image from 'next/image'
import Link from 'next/link'
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

function Heading({ children }: { children: string }) {
  return <h3 className='text-4xl lowercase tracking-widest'>{children}</h3>
}

function ProseBlock({ text }: { text: string }) {
  const paragraphs = splitParagraphs(text)
  if (paragraphs.length === 0) {
    return null
  }
  return (
    <div className='max-w-2xl space-y-4 px-6 text-lg leading-8 tracking-normal'>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  )
}

function OurStory({ content }: { content: OurStorySectionContent }) {
  return (
    <section id='our-story' className='flex flex-col items-center gap-6'>
      <Heading>{content.heading}</Heading>
      <ProseBlock text={content.body} />
    </section>
  )
}

function Travel({ content }: { content: TravelSectionContent }) {
  const services = content.services ?? []
  const stays = content.stays ?? []
  return (
    <section id='travel' className='flex flex-col items-center gap-6'>
      <Heading>{content.heading}</Heading>
      <ProseBlock text={content.body} />
      {services.length > 0 ? (
        <ul className='flex max-w-2xl flex-col gap-4 px-6 text-center'>
          {services.map((service) => (
            <li key={`${service.title}`}>
              <p className='text-xl tracking-wide'>{service.title}</p>
              <p className='font-thin text-lg leading-8 tracking-normal'>{service.description}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {stays.length > 0 ? (
        <ul className='flex w-full max-w-2xl flex-col gap-8'>
          {stays.map((stay) => (
            <li key={`${stay.name}`} className='flex flex-col items-center gap-3 text-center'>
              {stay.imageUrl ? (
                <div className='relative h-44 w-full max-w-md overflow-hidden'>
                  <Image
                    src={stay.imageUrl}
                    fill
                    sizes='(max-width: 768px) 100vw, 28rem'
                    className='object-cover'
                    alt={stay.name}
                  />
                </div>
              ) : null}
              <span className='text-2xl tracking-widest'>{stay.name}</span>
              {stay.description ? (
                <p className='max-w-md font-thin text-lg leading-8 tracking-normal'>
                  {stay.description}
                </p>
              ) : null}
              {stay.url ? (
                <Link
                  href={stay.url}
                  target='_blank'
                  rel='noreferrer'
                  className='underline underline-offset-4 hover:text-pink-500'
                >
                  View stay
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function Timeline({ content }: { content: TimelineSectionContent }) {
  if (content.milestones.length === 0) {
    return null
  }
  return (
    <section id='our-story' className='flex flex-col items-center gap-6'>
      <Heading>{content.heading}</Heading>
      <ul className='flex w-full max-w-3xl flex-col gap-6 sm:flex-row sm:justify-center sm:gap-10'>
        {content.milestones.map((milestone) => (
          <li
            key={`${milestone.year}-${milestone.title}`}
            className='flex flex-col items-center gap-1 text-center'
          >
            <span className='text-4xl tracking-widest'>{milestone.year}</span>
            <span className='text-lg lowercase tracking-widest'>{milestone.title}</span>
            {milestone.location ? (
              <span className='font-thin text-base tracking-normal'>{milestone.location}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function Destination({ content }: { content: DestinationSectionContent }) {
  if (!content.body.trim() && !content.imageUrl) {
    return null
  }
  return (
    <section id='destination' className='flex flex-col items-center gap-6'>
      <Heading>{content.heading}</Heading>
      {content.imageUrl ? (
        <div className='relative h-80 w-full max-w-3xl overflow-hidden px-6'>
          <Image
            src={content.imageUrl}
            fill
            sizes='(max-width: 768px) 100vw, 48rem'
            className='object-cover'
            alt={content.venueName ?? content.heading}
          />
        </div>
      ) : null}
      {content.location ? <p className='text-2xl tracking-widest'>{content.location}</p> : null}
      <ProseBlock text={content.body} />
      {content.venueName ? <p className='text-xl tracking-wide'>{content.venueName}</p> : null}
      {content.ctaLabel && content.ctaUrl ? (
        <Link
          href={content.ctaUrl}
          target='_blank'
          rel='noreferrer'
          className='underline underline-offset-4 hover:text-pink-500'
        >
          {content.ctaLabel}
        </Link>
      ) : null}
    </section>
  )
}

function Experiences({ content }: { content: ExperiencesSectionContent }) {
  if (content.items.length === 0) {
    return null
  }
  return (
    <section id='experiences' className='flex flex-col items-center gap-6'>
      <Heading>{content.heading}</Heading>
      <ul className='flex w-full max-w-3xl flex-col gap-10 sm:flex-row sm:flex-wrap sm:justify-center'>
        {content.items.map((item) => (
          <li
            key={`${item.title}`}
            className='flex w-full flex-col items-center gap-3 text-center sm:w-64'
          >
            {item.imageUrl ? (
              <div className='relative h-48 w-full overflow-hidden'>
                <Image
                  src={item.imageUrl}
                  fill
                  sizes='(max-width: 768px) 100vw, 16rem'
                  className='object-cover'
                  alt={item.title}
                />
              </div>
            ) : null}
            <span className='text-2xl tracking-widest'>{item.title}</span>
            {item.description ? (
              <p className='font-thin text-lg leading-8 tracking-normal'>{item.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function WeddingParty({ content }: { content: WeddingPartySectionContent }) {
  if (content.members.length === 0) {
    return null
  }
  return (
    <section id='wedding-party' className='flex flex-col items-center gap-6'>
      <Heading>{content.heading}</Heading>
      <ul className='flex w-full max-w-2xl flex-col gap-8'>
        {content.members.map((member) => (
          <li
            key={`${member.name}-${member.role}`}
            className='flex flex-col items-center gap-3 text-center'
          >
            {member.imageUrl ? (
              <div className='relative h-32 w-32 overflow-hidden rounded-full'>
                <Image
                  src={member.imageUrl}
                  fill
                  sizes='128px'
                  className='object-cover'
                  alt={member.name}
                />
              </div>
            ) : null}
            <div>
              <span className='text-lg'>{member.name}</span>
              {member.role ? <span className='text-base'> — {member.role}</span> : null}
            </div>
            {member.blurb ? (
              <p className='max-w-md text-base leading-7 tracking-normal'>{member.blurb}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function Faq({ content }: { content: FaqSectionContent }) {
  if (content.items.length === 0) {
    return null
  }
  return (
    <section id='faq' className='flex flex-col items-center gap-6'>
      <Heading>{content.heading}</Heading>
      <div className='flex max-w-2xl flex-col gap-6 px-6'>
        {content.items.map((item) => (
          <div key={item.question} className='flex flex-col gap-1'>
            <p className='text-xl tracking-wide'>{item.question}</p>
            <p className='font-thin text-lg leading-8 tracking-normal'>{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Registry({ content }: { content: RegistrySectionContent }) {
  return (
    <section id='registry' className='flex flex-col items-center gap-6'>
      <Heading>{content.heading}</Heading>
      <ProseBlock text={content.body} />
      {content.links.length > 0 && (
        <ul className='flex flex-col items-center gap-3 text-lg'>
          {content.links.map((link) => (
            <li key={`${link.label}-${link.url}`}>
              <Link
                href={link.url}
                target='_blank'
                rel='noreferrer'
                className='underline underline-offset-4 hover:text-pink-500'
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
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

export function ClassicSections({ sections }: { sections: WebsiteSection[] }) {
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
