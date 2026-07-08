import {
  buildWeddingLocalPart,
  composeWeddingAddress,
  localPartOf,
  slugifyName,
  weddingEmailDomain,
  withLocalPartSuffix,
} from '~/lib/email/wedding-address'

describe('wedding-address', () => {
  describe('slugifyName', () => {
    it('lower-cases and strips non-alphanumerics', () => {
      expect(slugifyName('Mary-Jane')).toBe('maryjane')
      expect(slugifyName("O'Brien")).toBe('obrien')
      expect(slugifyName('  John  ')).toBe('john')
    })

    it('strips diacritics', () => {
      expect(slugifyName('José')).toBe('jose')
      expect(slugifyName('Zoë')).toBe('zoe')
    })

    it('returns empty string for empty/nullish input', () => {
      expect(slugifyName('')).toBe('')
      expect(slugifyName(null)).toBe('')
      expect(slugifyName(undefined)).toBe('')
    })
  })

  describe('buildWeddingLocalPart', () => {
    it('builds a bride-and-groom slug', () => {
      expect(buildWeddingLocalPart('Jane', 'John')).toBe('jane-and-john')
    })

    it('falls back to "partner" when a name is empty', () => {
      expect(buildWeddingLocalPart('', 'John')).toBe('partner-and-john')
      expect(buildWeddingLocalPart('Jane', '   ')).toBe('jane-and-partner')
    })
  })

  describe('composeWeddingAddress', () => {
    it('appends the configured domain, lower-cased', () => {
      expect(composeWeddingAddress('jane-and-john')).toBe(`jane-and-john@${weddingEmailDomain()}`)
    })
  })

  describe('withLocalPartSuffix', () => {
    it('leaves the base unchanged for suffix <= 1', () => {
      expect(withLocalPartSuffix('jane-and-john', 1)).toBe('jane-and-john')
      expect(withLocalPartSuffix('jane-and-john', 0)).toBe('jane-and-john')
    })

    it('appends a numeric suffix for collisions', () => {
      expect(withLocalPartSuffix('jane-and-john', 2)).toBe('jane-and-john-2')
      expect(withLocalPartSuffix('jane-and-john', 7)).toBe('jane-and-john-7')
    })
  })

  describe('localPartOf', () => {
    it('extracts and normalizes the local part', () => {
      expect(localPartOf('Jane-and-John@W.OSWP.CARVALLO.IO')).toBe('jane-and-john')
    })
  })
})
