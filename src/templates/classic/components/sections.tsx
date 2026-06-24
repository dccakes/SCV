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
  FaqSectionContent,
  OurStorySectionContent,
  RegistrySectionContent,
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
  return (
    <section id='travel' className='flex flex-col items-center gap-6'>
      <Heading>{content.heading}</Heading>
      <ProseBlock text={content.body} />
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
