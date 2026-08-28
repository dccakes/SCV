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
