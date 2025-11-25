/**
 * Tests for lib/constants
 */

import { QUESTION_TYPE, QUESTION_TYPE_VALUES, ROUTES,RSVP_STATUS, RSVP_STATUS_VALUES } from '~/lib/constants'

describe('RSVP_STATUS', () => {
  it('should have correct status values', () => {
    expect(RSVP_STATUS.NOT_INVITED).toBe('Not Invited')
    expect(RSVP_STATUS.INVITED).toBe('Invited')
    expect(RSVP_STATUS.ATTENDING).toBe('Attending')
    expect(RSVP_STATUS.DECLINED).toBe('Declined')
  })

  it('should have all values in RSVP_STATUS_VALUES array', () => {
    expect(RSVP_STATUS_VALUES).toContain('Not Invited')
    expect(RSVP_STATUS_VALUES).toContain('Invited')
    expect(RSVP_STATUS_VALUES).toContain('Attending')
    expect(RSVP_STATUS_VALUES).toContain('Declined')
    expect(RSVP_STATUS_VALUES).toHaveLength(4)
  })
})

describe('QUESTION_TYPE', () => {
  it('should have correct type values', () => {
    expect(QUESTION_TYPE.TEXT).toBe('Text')
    expect(QUESTION_TYPE.OPTION).toBe('Option')
  })

  it('should have all values in QUESTION_TYPE_VALUES array', () => {
    expect(QUESTION_TYPE_VALUES).toContain('Text')
    expect(QUESTION_TYPE_VALUES).toContain('Option')
    expect(QUESTION_TYPE_VALUES).toHaveLength(2)
  })
})

describe('ROUTES', () => {
  it('should have correct auth routes', () => {
    expect(ROUTES.AUTH.LOGIN).toBe('/login')
    expect(ROUTES.AUTH.REGISTER).toBe('/register')
    expect(ROUTES.AUTH.LOGOUT).toBe('/logout')
  })

  it('should have correct main app routes', () => {
    expect(ROUTES.DASHBOARD).toBe('/dashboard')
    expect(ROUTES.GUEST_LIST).toBe('/guest-list')
    expect(ROUTES.EVENTS).toBe('/events')
    expect(ROUTES.WEBSITE).toBe('/website')
    expect(ROUTES.SETTINGS).toBe('/settings')
  })

  it('should generate correct wedding routes', () => {
    expect(ROUTES.WEDDING.HOME('testcouple')).toBe('/testcouple')
    expect(ROUTES.WEDDING.RSVP('testcouple')).toBe('/testcouple/rsvp')
  })
})
