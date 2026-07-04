import { MilestoneCategory } from '@prisma/client'

import {
  type CanonicalMilestoneSeed,
  getCanonicalMilestoneSeed,
  MILESTONE_SEED,
} from '~/server/domains/milestone/milestone.seed'

const EXPECTED_MILESTONES: ReadonlyArray<CanonicalMilestoneSeed> = [
  { key: 'date_set', title: 'Date set', category: MilestoneCategory.SETUP, position: 0 },
  {
    key: 'guest_list_drafted',
    title: 'Guest list drafted',
    category: MilestoneCategory.SETUP,
    position: 1,
  },
  { key: 'venue_booked', title: 'Venue booked', category: MilestoneCategory.VENDORS, position: 2 },
  {
    key: 'photographer_booked',
    title: 'Photographer booked',
    category: MilestoneCategory.VENDORS,
    position: 3,
  },
  {
    key: 'caterer_booked',
    title: 'Caterer booked',
    category: MilestoneCategory.VENDORS,
    position: 4,
  },
  {
    key: 'florist_booked',
    title: 'Florist booked',
    category: MilestoneCategory.VENDORS,
    position: 5,
  },
  {
    key: 'save_the_dates_sent',
    title: 'Save-the-dates sent',
    category: MilestoneCategory.INVITATIONS,
    position: 6,
  },
  {
    key: 'invitations_sent',
    title: 'Invitations sent',
    category: MilestoneCategory.INVITATIONS,
    position: 7,
  },
  {
    key: 'rsvps_collected',
    title: 'RSVPs collected',
    category: MilestoneCategory.INVITATIONS,
    position: 8,
  },
  {
    key: 'officiant_chosen',
    title: 'Officiant chosen',
    category: MilestoneCategory.LEGAL,
    position: 9,
  },
  {
    key: 'marriage_license_obtained',
    title: 'Marriage license obtained',
    category: MilestoneCategory.LEGAL,
    position: 10,
  },
  {
    key: 'final_headcount_sent',
    title: 'Final headcount sent to caterer',
    category: MilestoneCategory.FINALE,
    position: 11,
  },
  { key: 'wedding_day', title: 'Wedding day', category: MilestoneCategory.FINALE, position: 12 },
] as const

describe('milestone seed', () => {
  it('returns exactly 13 canonical milestones', () => {
    expect(getCanonicalMilestoneSeed()).toHaveLength(13)
    expect(MILESTONE_SEED).toHaveLength(13)
  })

  it('matches the canonical milestone keys, categories, and positions', () => {
    expect(getCanonicalMilestoneSeed()).toEqual(EXPECTED_MILESTONES)
    expect(MILESTONE_SEED).toEqual(EXPECTED_MILESTONES)
  })

  it('returns safe copies and keeps the canonical milestone seed frozen', () => {
    const [canonicalMilestone] = MILESTONE_SEED
    const [copiedMilestone] = getCanonicalMilestoneSeed()

    expect(Object.isFrozen(MILESTONE_SEED)).toBe(true)
    expect(Object.isFrozen(canonicalMilestone)).toBe(true)

    expect(copiedMilestone).not.toBe(canonicalMilestone)
    copiedMilestone.title = 'Changed copy only'

    expect(getCanonicalMilestoneSeed()[0]?.title).toBe('Date set')
    expect(MILESTONE_SEED[0]?.title).toBe('Date set')
  })
})
