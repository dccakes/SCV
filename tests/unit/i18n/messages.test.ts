import en from '~/i18n/messages/en.json'
import es from '~/i18n/messages/es.json'

function checkKeys(
  enObj: Record<string, unknown>,
  esObj: Record<string, unknown>,
  path = ''
): void {
  for (const key of Object.keys(enObj)) {
    const fullPath = path ? `${path}.${key}` : key

    if (!(key in esObj)) {
      throw new Error(`Missing key in es.json: ${fullPath}`)
    }

    const enVal = enObj[key]
    const esVal = esObj[key]

    if (typeof enVal === 'object' && enVal !== null) {
      if (typeof esVal !== 'object' || esVal === null) {
        throw new Error(`Key "${fullPath}" is an object in en.json but not in es.json`)
      }
      checkKeys(enVal as Record<string, unknown>, esVal as Record<string, unknown>, fullPath)
    }
  }
}

describe('i18n message completeness', () => {
  it('es.json contains all keys present in en.json', () => {
    expect(() =>
      checkKeys(en as Record<string, unknown>, es as Record<string, unknown>)
    ).not.toThrow()
  })

  it('en.json has all expected top-level namespaces', () => {
    const expectedNamespaces = ['common', 'invite', 'household', 'rsvp', 'questions', 'join']
    for (const ns of expectedNamespaces) {
      expect(en).toHaveProperty(ns)
    }
  })

  it('es.json has all expected top-level namespaces', () => {
    const expectedNamespaces = ['common', 'invite', 'household', 'rsvp', 'questions', 'join']
    for (const ns of expectedNamespaces) {
      expect(es).toHaveProperty(ns)
    }
  })
})

describe('i18n split message files', () => {
  const files = ['site', 'voyage', 'templates'] as const

  const collectKeys = (obj: Record<string, unknown>, path = ''): string[] =>
    Object.entries(obj).flatMap(([key, value]) => {
      const fullPath = path ? `${path}.${key}` : key
      return typeof value === 'object' && value !== null
        ? collectKeys(value as Record<string, unknown>, fullPath)
        : [fullPath]
    })

  it.each(files)('%s.json has identical keys in en and es', async (file) => {
    const enFile = (await import(`~/i18n/messages/en/${file}.json`)).default
    const esFile = (await import(`~/i18n/messages/es/${file}.json`)).default
    expect(collectKeys(esFile).sort()).toEqual(collectKeys(enFile).sort())
  })

  it('every es message is a non-empty string', async () => {
    for (const file of files) {
      const esFile = (await import(`~/i18n/messages/es/${file}.json`)).default
      const walk = (obj: Record<string, unknown>) => {
        for (const value of Object.values(obj)) {
          if (typeof value === 'object' && value !== null) walk(value as Record<string, unknown>)
          else expect(typeof value === 'string' && value.trim().length > 0).toBe(true)
        }
      }
      walk(esFile)
    }
  })

  it('split files never redefine a top-level namespace', async () => {
    const seen = new Set(Object.keys(en))
    for (const file of files) {
      const enFile = (await import(`~/i18n/messages/en/${file}.json`)).default
      for (const ns of Object.keys(enFile)) {
        expect(seen.has(ns)).toBe(false)
        seen.add(ns)
      }
    }
  })
})
