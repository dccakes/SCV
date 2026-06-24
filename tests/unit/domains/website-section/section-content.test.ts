import { SECTION_CATALOG } from '~/server/domains/website-section/website-section.catalog'
import { WebsiteSectionType } from '~/server/domains/website-section/website-section.types'
import {
  isValidSectionContent,
  parseSectionContent,
  updateSectionSchema,
  WEBSITE_SECTION_TYPES,
} from '~/server/domains/website-section/website-section.validator'

describe('section content validation', () => {
  it('parses valid content for every section type', () => {
    expect(parseSectionContent('HOME', { introText: 'hi' })).toEqual({ introText: 'hi' })
    expect(parseSectionContent('OUR_STORY', { heading: 'Us', body: 'Story' })).toEqual({
      heading: 'Us',
      body: 'Story',
    })
    expect(
      parseSectionContent('WEDDING_PARTY', {
        heading: 'Party',
        members: [{ name: 'Sam', role: 'Best Man' }],
      })
    ).toEqual({ heading: 'Party', members: [{ name: 'Sam', role: 'Best Man' }] })
    expect(
      parseSectionContent('FAQ', { heading: 'FAQ', items: [{ question: 'Q', answer: 'A' }] })
    ).toEqual({ heading: 'FAQ', items: [{ question: 'Q', answer: 'A' }] })
    expect(
      parseSectionContent('REGISTRY', {
        heading: 'Gifts',
        body: 'note',
        links: [{ label: 'Zola', url: 'https://zola.com' }],
      })
    ).toEqual({
      heading: 'Gifts',
      body: 'note',
      links: [{ label: 'Zola', url: 'https://zola.com' }],
    })
  })

  it('accepts wedding party members with an optional photo and blurb', () => {
    const content = {
      heading: 'Party',
      members: [
        {
          name: 'Sam',
          role: 'Best Man',
          imageUrl: 'https://example.com/sam.jpg',
          blurb: 'College roommate and the groom’s oldest friend.',
        },
      ],
    }
    expect(parseSectionContent('WEDDING_PARTY', content)).toEqual(content)
  })

  it('rejects a wedding party member photo that is not a valid URL', () => {
    expect(
      isValidSectionContent('WEDDING_PARTY', {
        heading: 'Party',
        members: [{ name: 'Sam', role: 'Best Man', imageUrl: 'not-a-url' }],
      })
    ).toBe(false)
  })

  it('rejects content that does not match the section type', () => {
    expect(isValidSectionContent('OUR_STORY', { introText: 'wrong shape' })).toBe(false)
    expect(
      isValidSectionContent('REGISTRY', {
        heading: 'x',
        body: 'y',
        links: [{ label: 'a', url: 'not-a-url' }],
      })
    ).toBe(false)
    expect(() => parseSectionContent('HOME', { introText: 123 })).toThrow()
  })

  it('validates update input against the declared type via the schema', () => {
    const ok = updateSectionSchema.safeParse({
      type: 'OUR_STORY',
      isEnabled: true,
      content: { heading: 'Our Story', body: 'We met...' },
    })
    expect(ok.success).toBe(true)

    const bad = updateSectionSchema.safeParse({
      type: 'OUR_STORY',
      content: { heading: 'Our Story' },
    })
    expect(bad.success).toBe(false)
  })

  it('keeps the catalog and type enum in sync', () => {
    const catalogTypes = SECTION_CATALOG.map((entry) => entry.type).sort()
    expect(catalogTypes).toEqual([...WEBSITE_SECTION_TYPES].sort())
    expect(catalogTypes).toEqual(Object.values(WebsiteSectionType).sort())
  })

  it('assigns unique, ordered positions in the catalog', () => {
    const positions = SECTION_CATALOG.map((entry) => entry.position)
    expect(new Set(positions).size).toBe(positions.length)
    expect(SECTION_CATALOG[0]?.type).toBe('HOME')
  })
})
