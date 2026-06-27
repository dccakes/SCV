import { DEFAULT_TEMPLATE_ID, isKnownTemplateId, TEMPLATE_IDS } from '~/templates/catalog'

describe('template catalog', () => {
  it('includes the classic and aurelia templates', () => {
    expect(TEMPLATE_IDS).toEqual(expect.arrayContaining(['classic', 'aurelia']))
  })

  it('defaults to the classic template', () => {
    expect(DEFAULT_TEMPLATE_ID).toBe('classic')
  })

  it('recognises known template ids', () => {
    expect(isKnownTemplateId('classic')).toBe(true)
    expect(isKnownTemplateId('aurelia')).toBe(true)
  })

  it('rejects unknown or empty template ids', () => {
    expect(isKnownTemplateId('does-not-exist')).toBe(false)
    expect(isKnownTemplateId(null)).toBe(false)
    expect(isKnownTemplateId(undefined)).toBe(false)
    expect(isKnownTemplateId('')).toBe(false)
  })
})
