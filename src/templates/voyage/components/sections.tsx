/**
 * VoyageSections
 *
 * Voyage's editorial section layouts: a horizontal story timeline with hand-
 * drawn landmark sketches, a two-column destination feature, a row of curated
 * experience cards, a travel grid with thin-line services and stay cards, plus
 * refined takes on wedding party, FAQ and registry.
 *
 * Each block is exported individually so the Home surface can compose them in a
 * bespoke editorial order (interleaving the hero, weekend itinerary and gallery
 * that are not themselves sections). `VoyageSections` renders any enabled
 * sections in stored order to satisfy the template contract.
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
import {
  BotanicalSprig,
  bodyFont,
  Eyebrow,
  GoldRule,
  headingFont,
  IconArrow,
  IconCar,
  IconCompass,
  IconConcierge,
  LandmarkSketch,
  OutlineButton,
} from '~/templates/voyage/components/primitives'

/** Wrapper that gives every section consistent vertical rhythm and width. */
function Band({
  id,
  tone = 'ivory',
  className = '',
  children,
}: {
  id?: string
  tone?: 'ivory' | 'cream'
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className={`w-full scroll-mt-24 px-6 py-20 sm:py-24 lg:px-10 ${
        tone === 'cream' ? 'bg-[#FBF8F1]' : 'bg-[#F7F3EA]'
      } ${className}`}
    >
      <div className='mx-auto max-w-6xl'>{children}</div>
    </section>
  )
}

function CenteredHead({ eyebrow, heading }: { eyebrow?: string; heading: string }) {
  return (
    <div className='flex flex-col items-center gap-4 text-center'>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2
        className={`${headingFont} max-w-3xl text-balance font-light text-4xl text-[#1E1C18] sm:text-5xl`}
      >
        {heading}
      </h2>
      <GoldRule />
    </div>
  )
}

function Prose({ text, className = '' }: { text: string; className?: string }) {
  const paragraphs = splitParagraphs(text)
  if (paragraphs.length === 0) {
    return null
  }
  return (
    <div className={`space-y-5 text-[#746E64] text-[1.06rem] leading-8 ${bodyFont} ${className}`}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  )
}

export function VoyageOurStory({ content }: { content: OurStorySectionContent }) {
  if (!content.body.trim()) {
    return null
  }
  return (
    <Band id='our-story'>
      <div className='flex flex-col items-center gap-8'>
        <CenteredHead eyebrow='Our Story' heading={content.heading} />
        <div className='max-w-2xl text-center'>
          <Prose text={content.body} />
        </div>
      </div>
    </Band>
  )
}

export function VoyageTimeline({ content }: { content: TimelineSectionContent }) {
  if (content.milestones.length === 0) {
    return null
  }
  return (
    <Band id='our-story'>
      <div className='flex flex-col items-center gap-14'>
        <CenteredHead eyebrow={content.eyebrow ?? 'Our Story'} heading={content.heading} />
        <ol className='relative grid w-full gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6'>
          {/* The connecting champagne line across desktop columns. */}
          <span
            aria-hidden='true'
            className='absolute top-[0.4rem] right-[12%] left-[12%] hidden h-px bg-[#B89455]/40 lg:block'
          />
          {content.milestones.map((milestone, index) => (
            <li
              key={`${milestone.year}-${milestone.title}`}
              className='relative flex flex-col items-center gap-3 text-center'
            >
              <span
                aria-hidden='true'
                className='h-2 w-2 rounded-full border border-[#B89455] bg-[#F7F3EA] ring-4 ring-[#F7F3EA]'
              />
              <span className={`${headingFont} font-light text-3xl text-[#B89455]`}>
                {milestone.year}
              </span>
              <span className='font-[family-name:var(--tpl-label-font)] text-[#1E1C18] text-[0.66rem] uppercase tracking-[0.24em]'>
                {milestone.title}
              </span>
              {milestone.location ? (
                <span className={`${bodyFont} text-[#746E64] text-sm italic`}>
                  {milestone.location}
                </span>
              ) : null}
              <LandmarkSketch index={index} className='mt-2 h-12 w-auto text-[#B89455]/70' />
            </li>
          ))}
        </ol>
      </div>
    </Band>
  )
}

export function VoyageDestination({ content }: { content: DestinationSectionContent }) {
  if (!content.body.trim() && !content.imageUrl) {
    return null
  }
  return (
    <Band id='destination' tone='cream' className='overflow-hidden'>
      <div className='grid items-stretch gap-10 lg:grid-cols-2 lg:gap-16'>
        <div className='relative min-h-[20rem] overflow-hidden rounded-[3px] border border-[#DED4C4]'>
          {content.imageUrl ? (
            <Image
              src={content.imageUrl}
              alt={content.venueName ?? content.heading}
              fill
              sizes='(max-width: 1024px) 100vw, 50vw'
              className='object-cover'
            />
          ) : (
            <div className='absolute inset-0 flex items-center justify-center bg-[#F1EADB]'>
              <BotanicalSprig className='h-2/3 w-auto text-[#B89455]/30' />
            </div>
          )}
        </div>

        <div className='relative flex flex-col justify-center gap-6 py-2'>
          <BotanicalSprig
            aria-hidden='true'
            className='pointer-events-none absolute top-0 -right-4 hidden h-full w-auto text-[#B89455]/15 lg:block'
          />
          {content.eyebrow ? <Eyebrow>{content.eyebrow}</Eyebrow> : null}
          <h2
            className={`${headingFont} font-light text-4xl text-[#1E1C18] leading-tight sm:text-5xl`}
          >
            {content.heading}
            {content.location ? (
              <span className='mt-1 block text-[#746E64] italic'>{content.location}</span>
            ) : null}
          </h2>
          <Prose text={content.body} className='max-w-xl' />
          {content.venueName ? (
            <div className='border-[#B89455]/50 border-l-2 pl-4'>
              <p className={`${headingFont} text-[#1E1C18] text-xl`}>{content.venueName}</p>
              {content.venueNote ? (
                <p className={`${bodyFont} text-[#746E64] text-sm italic`}>{content.venueNote}</p>
              ) : null}
            </div>
          ) : null}
          {content.ctaLabel && content.ctaUrl ? (
            <div className='pt-2'>
              <OutlineButton href={content.ctaUrl} external>
                {content.ctaLabel}
                <IconArrow className='h-4 w-4' />
              </OutlineButton>
            </div>
          ) : null}
        </div>
      </div>
    </Band>
  )
}

export function VoyageExperiences({ content }: { content: ExperiencesSectionContent }) {
  if (content.items.length === 0) {
    return null
  }
  return (
    <Band id='experiences'>
      <div className='flex flex-col items-center gap-12'>
        <CenteredHead
          eyebrow={content.eyebrow ?? 'Curated Experiences'}
          heading={content.heading}
        />
        <div className='grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {content.items.map((item) => (
            <article
              key={`${item.title}`}
              className='group flex flex-col overflow-hidden rounded-[3px] border border-[#DED4C4] bg-[#FBF8F1]'
            >
              <div className='relative aspect-[4/5] overflow-hidden bg-[#F1EADB]'>
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes='(max-width: 1024px) 50vw, 25vw'
                    className='object-cover transition-transform duration-700 group-hover:scale-[1.05]'
                  />
                ) : (
                  <div className='flex h-full items-center justify-center'>
                    <BotanicalSprig className='h-1/2 w-auto text-[#B89455]/30' />
                  </div>
                )}
              </div>
              <div className='flex flex-1 flex-col gap-2 px-5 py-6 text-center'>
                <h3 className={`${headingFont} text-2xl text-[#1E1C18] italic`}>{item.title}</h3>
                {item.description ? (
                  <p className={`${bodyFont} text-[#746E64] text-sm leading-6`}>
                    {item.description}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </Band>
  )
}

export function VoyageWeddingParty({ content }: { content: WeddingPartySectionContent }) {
  if (content.members.length === 0) {
    return null
  }
  return (
    <Band id='wedding-party' tone='cream'>
      <div className='flex flex-col items-center gap-12'>
        <CenteredHead eyebrow='By Our Side' heading={content.heading} />
        <div className='grid w-full gap-8 sm:grid-cols-2 lg:grid-cols-3'>
          {content.members.map((member) => (
            <div
              key={`${member.name}-${member.role}`}
              className='flex flex-col items-center gap-3 text-center'
            >
              {member.imageUrl ? (
                <div className='relative h-40 w-40 overflow-hidden rounded-full border border-[#DED4C4]'>
                  <Image
                    src={member.imageUrl}
                    alt={member.name}
                    fill
                    sizes='160px'
                    className='object-cover'
                  />
                </div>
              ) : (
                <div className='flex h-40 w-40 items-center justify-center rounded-full border border-[#DED4C4] bg-[#FBF8F1]'>
                  <span className={`${headingFont} text-3xl text-[#B89455]`}>
                    {member.name?.[0] ?? '·'}
                  </span>
                </div>
              )}
              <p className={`${headingFont} text-2xl text-[#1E1C18]`}>{member.name}</p>
              <p className='font-[family-name:var(--tpl-label-font)] text-[#B89455] text-[0.62rem] uppercase tracking-[0.24em]'>
                {member.role}
              </p>
              {member.blurb ? (
                <p className={`${bodyFont} max-w-xs text-[#746E64] text-sm leading-6`}>
                  {member.blurb}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </Band>
  )
}

const SERVICE_ICONS = [IconCar, IconConcierge, IconCompass]

export function VoyageTravel({ content }: { content: TravelSectionContent }) {
  const services = content.services ?? []
  const stays = content.stays ?? []
  if (!content.body.trim() && services.length === 0 && stays.length === 0) {
    return null
  }
  return (
    <Band id='travel'>
      <div className='grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16'>
        <div className='flex flex-col gap-6'>
          <Eyebrow>Travel &amp; Stay</Eyebrow>
          <h2 className={`${headingFont} font-light text-4xl text-[#1E1C18] sm:text-5xl`}>
            {content.heading}
          </h2>
          <GoldRule className='self-start' />
          <Prose text={content.body} />
          {services.length > 0 ? (
            <ul className='mt-2 flex flex-col gap-5'>
              {services.map((service, index) => {
                const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length] ?? IconCompass
                return (
                  <li key={`${service.title}`} className='flex items-start gap-4'>
                    <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DED4C4] text-[#B89455]'>
                      <Icon className='h-5 w-5' />
                    </span>
                    <div>
                      <p className='font-[family-name:var(--tpl-label-font)] text-[#1E1C18] text-[0.66rem] uppercase tracking-[0.22em]'>
                        {service.title}
                      </p>
                      <p className={`${bodyFont} text-[#746E64] text-sm leading-6`}>
                        {service.description}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>

        {stays.length > 0 ? (
          <div className='flex flex-col gap-5'>
            <Eyebrow className='lg:text-right'>Recommended Stays</Eyebrow>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {stays.map((stay) => {
                const card = (
                  <>
                    <div className='relative aspect-[4/3] overflow-hidden bg-[#F1EADB]'>
                      {stay.imageUrl ? (
                        <Image
                          src={stay.imageUrl}
                          alt={stay.name}
                          fill
                          sizes='(max-width: 1024px) 50vw, 20vw'
                          className='object-cover transition-transform duration-700 group-hover:scale-[1.05]'
                        />
                      ) : (
                        <div className='flex h-full items-center justify-center'>
                          <BotanicalSprig className='h-1/2 w-auto text-[#B89455]/30' />
                        </div>
                      )}
                    </div>
                    <div className='flex flex-col gap-1 px-4 py-4'>
                      <p className='font-[family-name:var(--tpl-label-font)] text-[#1E1C18] text-[0.62rem] uppercase tracking-[0.2em]'>
                        {stay.name}
                      </p>
                      {stay.description ? (
                        <p className={`${bodyFont} text-[#746E64] text-sm leading-6`}>
                          {stay.description}
                        </p>
                      ) : null}
                    </div>
                  </>
                )
                const cardClass =
                  'group flex flex-col overflow-hidden rounded-[3px] border border-[#DED4C4] bg-[#FBF8F1]'
                return stay.url ? (
                  <a
                    key={`${stay.name}`}
                    href={stay.url}
                    target='_blank'
                    rel='noreferrer'
                    className={`${cardClass} transition-colors hover:border-[#B89455]`}
                  >
                    {card}
                  </a>
                ) : (
                  <div key={`${stay.name}`} className={cardClass}>
                    {card}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </Band>
  )
}

export function VoyageFaq({ content }: { content: FaqSectionContent }) {
  if (content.items.length === 0) {
    return null
  }
  return (
    <Band id='faq' tone='cream'>
      <div className='flex flex-col items-center gap-12'>
        <CenteredHead eyebrow='Good to Know' heading={content.heading} />
        <dl className='grid w-full max-w-4xl gap-x-12 gap-y-8 sm:grid-cols-2'>
          {content.items.map((item) => (
            <div key={`${item.question}`} className='border-[#DED4C4] border-t pt-5'>
              <dt className={`${headingFont} text-[#1E1C18] text-xl`}>{item.question}</dt>
              <dd className={`${bodyFont} mt-2 text-[#746E64] text-[0.98rem] leading-7`}>
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Band>
  )
}

export function VoyageRegistry({ content }: { content: RegistrySectionContent }) {
  return (
    <div className='flex flex-col gap-6'>
      <Eyebrow>Registry</Eyebrow>
      <h2 className={`${headingFont} font-light text-4xl text-[#1E1C18] leading-tight sm:text-5xl`}>
        {content.heading}
      </h2>
      <GoldRule className='self-start' />
      <Prose text={content.body} />
      {content.links.length > 0 ? (
        <div className='flex flex-wrap gap-3 pt-2'>
          {content.links.map((link) => (
            <a
              key={`${link.label}-${link.url}`}
              href={link.url}
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-2 rounded-[2px] border border-[#1E1C18]/30 px-5 py-2.5 font-[family-name:var(--tpl-label-font)] text-[#1E1C18] text-[0.64rem] uppercase tracking-[0.22em] transition-colors hover:border-[#B89455] hover:text-[#B89455]'
            >
              {link.label}
              <IconArrow className='h-4 w-4' />
            </a>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Contract renderer: render any enabled sections in their stored order. The
 * Home surface composes the bespoke editorial order itself, so this is a
 * straightforward fallback (also used by any future surface that opts in).
 */
export function VoyageSections({ sections }: { sections: WebsiteSection[] }) {
  if (sections.length === 0) {
    return null
  }
  return (
    <>
      {sections.map((section) => {
        switch (section.type) {
          case 'OUR_STORY':
            return <VoyageOurStory key={section.id} content={section.content} />
          case 'TIMELINE':
            return <VoyageTimeline key={section.id} content={section.content} />
          case 'DESTINATION':
            return <VoyageDestination key={section.id} content={section.content} />
          case 'EXPERIENCES':
            return <VoyageExperiences key={section.id} content={section.content} />
          case 'WEDDING_PARTY':
            return <VoyageWeddingParty key={section.id} content={section.content} />
          case 'TRAVEL':
            return <VoyageTravel key={section.id} content={section.content} />
          case 'FAQ':
            return <VoyageFaq key={section.id} content={section.content} />
          case 'REGISTRY':
            return (
              <Band key={section.id} id='registry' tone='cream'>
                <VoyageRegistry content={section.content} />
              </Band>
            )
          default:
            return null
        }
      })}
    </>
  )
}
