import { TEMPLATES } from '~/templates/registry'

const REQUIRED_SURFACES = [
  'Home',
  'HomeMobile',
  'Minimal',
  'SaveTheDate',
  'Invitation',
  'Sections',
] as const

describe('template contract', () => {
  it('registers more than one template', () => {
    expect(TEMPLATES.length).toBeGreaterThan(1)
  })

  it.each(
    TEMPLATES.map((template) => [template.id, template])
  )('%s provides every required surface component and a theme', (_id, template) => {
    for (const surface of REQUIRED_SURFACES) {
      expect(typeof template.components[surface]).toBe('function')
    }
    expect(template.theme.cssVars).toBeDefined()
    expect(typeof template.theme.fontClassName).toBe('string')
  })
})
