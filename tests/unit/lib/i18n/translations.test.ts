import {
  alignTranslation,
  overlayTranslation,
  readEventTranslations,
  readTranslation,
  syncRemovedItems,
} from '~/lib/i18n/translations'

describe('overlayTranslation', () => {
  it('replaces strings that have a non-blank translation', () => {
    expect(
      overlayTranslation({ heading: 'Our Story', body: 'Hi' }, { heading: 'Nuestra historia' })
    ).toEqual({
      heading: 'Nuestra historia',
      body: 'Hi',
    })
  })

  it('falls back to English when the translation is blank or missing', () => {
    expect(
      overlayTranslation({ heading: 'FAQ', body: 'Body' }, { heading: '   ', body: undefined })
    ).toEqual({ heading: 'FAQ', body: 'Body' })
    expect(overlayTranslation({ heading: 'FAQ' }, undefined)).toEqual({ heading: 'FAQ' })
    expect(overlayTranslation({ heading: 'FAQ' }, 'not-an-object')).toEqual({ heading: 'FAQ' })
  })

  it('merges arrays by position and ignores extra translated items', () => {
    const base = {
      items: [
        { question: 'Q1', answer: 'A1' },
        { question: 'Q2', answer: 'A2' },
      ],
    }
    const overlay = { items: [{ question: 'P1' }, undefined, { question: 'P3', answer: 'R3' }] }
    expect(overlayTranslation(base, overlay)).toEqual({
      items: [
        { question: 'P1', answer: 'A1' },
        { question: 'Q2', answer: 'A2' },
      ],
    })
  })

  it('never lets a translation override links or images', () => {
    const base = {
      ctaUrl: 'https://a.com',
      imageUrl: 'https://img',
      links: [{ label: 'Gift', url: 'https://g' }],
    }
    const overlay = {
      ctaUrl: 'https://evil',
      imageUrl: 'https://x',
      links: [{ label: 'Regalo', url: 'https://evil' }],
    }
    expect(overlayTranslation(base, overlay)).toEqual({
      ctaUrl: 'https://a.com',
      imageUrl: 'https://img',
      links: [{ label: 'Regalo', url: 'https://g' }],
    })
  })

  it('uses a translated string even where English was left empty', () => {
    expect(
      overlayTranslation(
        { venue: null as string | null, eyebrow: undefined as string | undefined },
        { venue: 'Hacienda', eyebrow: 'Hola' }
      )
    ).toEqual({
      venue: 'Hacienda',
      eyebrow: 'Hola',
    })
  })

  it('keeps non-string values from the base', () => {
    const date = new Date('2027-05-01')
    expect(
      overlayTranslation({ date, count: 2, ok: true }, { date: 'x', count: 3, ok: false })
    ).toEqual({
      date,
      count: 2,
      ok: true,
    })
  })

  it('does not mutate its inputs', () => {
    const base = { items: [{ question: 'Q' }] }
    const overlay = { items: [{ question: 'P' }] }
    overlayTranslation(base, overlay)
    expect(base).toEqual({ items: [{ question: 'Q' }] })
  })
})

describe('alignTranslation', () => {
  it('mirrors the English shape with translated strings or blanks', () => {
    const base = {
      heading: 'Travel',
      stays: [
        { name: 'Hotel', url: 'https://h', description: 'Nice' },
        { name: 'Inn', imageUrl: 'https://i' },
      ],
    }
    expect(alignTranslation(base, { heading: 'Viaje', stays: [{ name: 'Hotel ES' }] })).toEqual({
      heading: 'Viaje',
      stays: [
        { name: 'Hotel ES', url: 'https://h', description: '' },
        { name: '', imageUrl: 'https://i' },
      ],
    })
  })
})

describe('alignTranslation optional fields', () => {
  it('keeps Spanish text for optional fields English left empty or out', () => {
    expect(alignTranslation({}, { message: 'Hola' })).toEqual({ message: 'Hola' })
    expect(alignTranslation({ eyebrow: undefined }, { eyebrow: 'Reserva la fecha' })).toEqual({
      eyebrow: 'Reserva la fecha',
    })
    expect(
      alignTranslation(
        { items: [{ title: 'Dinner' }] },
        { items: [{ title: 'Cena', description: 'Rica' }] }
      )
    ).toEqual({ items: [{ title: 'Cena', description: 'Rica' }] })
  })

  it('never adds links, media or non-text values from the translation', () => {
    expect(
      alignTranslation({ heading: 'H' }, { imageUrl: 'https://x', ctaUrl: 'https://y', extra: 3 })
    ).toEqual({ heading: '' })
  })
})

describe('readTranslation', () => {
  it('returns the overlay for Spanish and nothing for English', () => {
    const translations = { es: { heading: 'Hola' } }
    expect(readTranslation(translations, 'es')).toEqual({ heading: 'Hola' })
    expect(readTranslation(translations, 'en')).toBeUndefined()
    expect(readTranslation(null, 'es')).toBeUndefined()
    expect(readTranslation('junk', 'es')).toBeUndefined()
  })
})

describe('syncRemovedItems', () => {
  it('removes the same row from the translation when an English row is deleted', () => {
    const a = { question: 'A' }
    const b = { question: 'B' }
    const c = { question: 'C' }
    const prev = { heading: 'FAQ', items: [a, b, c] }
    const next = { heading: 'FAQ', items: [a, c] }
    const es = { heading: 'P', items: [{ question: 'PA' }, { question: 'PB' }, { question: 'PC' }] }
    expect(syncRemovedItems(prev, next, es)).toEqual({
      heading: 'P',
      items: [{ question: 'PA' }, { question: 'PC' }],
    })
  })

  it('leaves the translation untouched when no row was removed', () => {
    const es = { items: [{ question: 'PA' }] }
    const items = [{ question: 'A' }]
    expect(syncRemovedItems({ items }, { items: [...items, { question: 'B' }] }, es)).toBe(es)
  })
})

describe('readEventTranslations', () => {
  it('reads the stored Spanish event text and ignores junk', () => {
    expect(readEventTranslations({ es: { name: 'Boda', venue: 3 } })).toEqual({
      es: { name: 'Boda', venue: undefined, attire: undefined, description: undefined },
    })
    expect(readEventTranslations(null)).toBeUndefined()
    expect(readEventTranslations({ en: {} })).toBeUndefined()
  })
})
