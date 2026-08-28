import { VendorCategory, VendorStatus } from '@prisma/client'

import {
  deriveMilestoneStatus,
  MANUAL_MILESTONE_KEYS,
  type MilestoneDerivationState,
} from '~/server/domains/milestone/milestone.derivation'
import { MILESTONE_KEYS } from '~/server/domains/milestone/milestone.seed'

const createState = (
  overrides: Partial<MilestoneDerivationState> = {}
): MilestoneDerivationState => ({
  primaryEventDate: null,
  guestCount: 0,
  vendors: [],
  invitations: [],
  now: new Date('2026-04-26T12:00:00.000Z'),
  ...overrides,
})

describe('milestone derivation', () => {
  it('covers all 13 canonical milestone keys', () => {
    const state = createState()

    const derivedStatuses = MILESTONE_KEYS.map((key) => deriveMilestoneStatus(key, state))

    expect(derivedStatuses).toHaveLength(MILESTONE_KEYS.length)
    expect(derivedStatuses.every((status) => status === 'pending' || status === 'done')).toBe(true)
    expect(derivedStatuses).toEqual(Array.from({ length: MILESTONE_KEYS.length }, () => 'pending'))
  })

  it('derives done and pending for each state-driven milestone key', () => {
    expect(
      deriveMilestoneStatus(
        'date_set',
        createState({
          primaryEventDate: new Date('2026-09-01T00:00:00.000Z'),
        })
      )
    ).toBe('done')
    expect(deriveMilestoneStatus('date_set', createState())).toBe('pending')

    expect(
      deriveMilestoneStatus(
        'guest_list_drafted',
        createState({
          guestCount: 1,
        })
      )
    ).toBe('done')
    expect(
      deriveMilestoneStatus(
        'guest_list_drafted',
        createState({
          guestCount: 0,
        })
      )
    ).toBe('pending')

    expect(
      deriveMilestoneStatus(
        'venue_booked',
        createState({
          vendors: [{ category: VendorCategory.VENUE, status: VendorStatus.SELECTED }],
        })
      )
    ).toBe('done')
    expect(
      deriveMilestoneStatus(
        'venue_booked',
        createState({
          vendors: [{ category: VendorCategory.VENUE, status: VendorStatus.IN_REVIEW }],
        })
      )
    ).toBe('pending')

    expect(
      deriveMilestoneStatus(
        'photographer_booked',
        createState({
          vendors: [{ category: VendorCategory.PHOTOGRAPHER, status: VendorStatus.SELECTED }],
        })
      )
    ).toBe('done')
    expect(
      deriveMilestoneStatus(
        'photographer_booked',
        createState({
          vendors: [{ category: VendorCategory.PHOTOGRAPHER, status: VendorStatus.IN_NEGOTIATION }],
        })
      )
    ).toBe('pending')

    expect(
      deriveMilestoneStatus(
        'caterer_booked',
        createState({
          vendors: [{ category: VendorCategory.CATERING, status: VendorStatus.SELECTED }],
        })
      )
    ).toBe('done')
    expect(
      deriveMilestoneStatus(
        'caterer_booked',
        createState({
          vendors: [{ category: VendorCategory.CATERING, status: VendorStatus.PRE_SELECTED }],
        })
      )
    ).toBe('pending')

    expect(
      deriveMilestoneStatus(
        'florist_booked',
        createState({
          vendors: [{ category: VendorCategory.FLOWERS, status: VendorStatus.SELECTED }],
        })
      )
    ).toBe('done')
    expect(
      deriveMilestoneStatus(
        'florist_booked',
        createState({
          vendors: [{ category: VendorCategory.FLOWERS, status: VendorStatus.DECLINED }],
        })
      )
    ).toBe('pending')

    expect(
      deriveMilestoneStatus(
        'rsvps_collected',
        createState({
          invitations: [{ rsvp: 'Attending' }],
        })
      )
    ).toBe('done')
    expect(
      deriveMilestoneStatus(
        'rsvps_collected',
        createState({
          invitations: [{ rsvp: 'Invited' }],
        })
      )
    ).toBe('pending')

    expect(
      deriveMilestoneStatus(
        'wedding_day',
        createState({
          primaryEventDate: new Date('2026-04-25T23:59:59.000Z'),
        })
      )
    ).toBe('done')
    expect(
      deriveMilestoneStatus(
        'wedding_day',
        createState({
          primaryEventDate: new Date('2026-04-27T00:00:00.000Z'),
        })
      )
    ).toBe('pending')
  })

  it('manual milestones always derive pending', () => {
    const state = createState({
      primaryEventDate: new Date('2025-01-01T00:00:00.000Z'),
      guestCount: 250,
      vendors: [
        { category: VendorCategory.VENUE, status: VendorStatus.SELECTED },
        { category: VendorCategory.PHOTOGRAPHER, status: VendorStatus.SELECTED },
        { category: VendorCategory.CATERING, status: VendorStatus.SELECTED },
        { category: VendorCategory.FLOWERS, status: VendorStatus.SELECTED },
      ],
      invitations: Array.from({ length: 100 }, () => ({ rsvp: 'Attending' })),
    })

    expect(MANUAL_MILESTONE_KEYS).toEqual([
      'save_the_dates_sent',
      'invitations_sent',
      'officiant_chosen',
      'marriage_license_obtained',
      'final_headcount_sent',
    ])

    for (const key of MANUAL_MILESTONE_KEYS) {
      expect(deriveMilestoneStatus(key, state)).toBe('pending')
    }
  })

  it('applies the RSVP threshold boundary exactly at 90%', () => {
    const pendingState = createState({
      invitations: [
        ...Array.from({ length: 89 }, () => ({ rsvp: 'Attending' })),
        ...Array.from({ length: 11 }, () => ({ rsvp: 'Invited' })),
      ],
    })
    const atThresholdState = createState({
      invitations: [
        ...Array.from({ length: 90 }, () => ({ rsvp: 'Attending' })),
        ...Array.from({ length: 10 }, () => ({ rsvp: 'Invited' })),
      ],
    })
    const aboveThresholdState = createState({
      invitations: [
        ...Array.from({ length: 91 }, () => ({ rsvp: 'Attending' })),
        ...Array.from({ length: 9 }, () => ({ rsvp: 'Invited' })),
      ],
    })

    expect(deriveMilestoneStatus('rsvps_collected', pendingState)).toBe('pending')
    expect(deriveMilestoneStatus('rsvps_collected', atThresholdState)).toBe('done')
    expect(deriveMilestoneStatus('rsvps_collected', aboveThresholdState)).toBe('done')
  })

  it('ignores null, empty, and malformed RSVP values outside the eligible RSVP set', () => {
    const invalidResponsesState = createState({
      invitations: [
        ...Array.from({ length: 8 }, () => ({ rsvp: 'Attending' })),
        ...Array.from({ length: 2 }, () => ({ rsvp: 'Invited' })),
        { rsvp: null },
        { rsvp: '' },
        { rsvp: 'Maybe' },
        { rsvp: 'Invited ' },
        { rsvp: ' invited' },
        { rsvp: 'Unknown' },
        { rsvp: 'RSVP_PENDING' },
        { rsvp: '---' },
        { rsvp: '0' },
        { rsvp: 'Declined!' },
      ],
    })

    expect(deriveMilestoneStatus('rsvps_collected', invalidResponsesState)).toBe('pending')
  })

  it('excludes Not Invited rows from the RSVP threshold calculation', () => {
    const multiEventState = createState({
      invitations: [
        ...Array.from({ length: 8 }, () => ({ rsvp: 'Attending' })),
        ...Array.from({ length: 2 }, () => ({ rsvp: 'Invited' })),
        ...Array.from({ length: 10 }, () => ({ rsvp: 'Not Invited' })),
      ],
    })

    expect(deriveMilestoneStatus('rsvps_collected', multiEventState)).toBe('pending')
  })
})
