import { MilestoneCategory } from '@prisma/client'

export const MILESTONE_KEYS = [
  'date_set',
  'guest_list_drafted',
  'venue_booked',
  'photographer_booked',
  'caterer_booked',
  'florist_booked',
  'save_the_dates_sent',
  'invitations_sent',
  'rsvps_collected',
  'officiant_chosen',
  'marriage_license_obtained',
  'final_headcount_sent',
  'wedding_day',
] as const

export type CanonicalMilestoneKey = (typeof MILESTONE_KEYS)[number]

export type CanonicalMilestoneSeed = {
  key: CanonicalMilestoneKey
  title: string
  category: MilestoneCategory
  position: number
}

function freezeSeedEntry<const T extends CanonicalMilestoneSeed>(entry: T): Readonly<T> {
  return Object.freeze({ ...entry })
}

export const MILESTONE_SEED: ReadonlyArray<CanonicalMilestoneSeed> = Object.freeze([
  freezeSeedEntry({
    key: 'date_set',
    title: 'Date set',
    category: MilestoneCategory.SETUP,
    position: 0,
  }),
  freezeSeedEntry({
    key: 'guest_list_drafted',
    title: 'Guest list drafted',
    category: MilestoneCategory.SETUP,
    position: 1,
  }),
  freezeSeedEntry({
    key: 'venue_booked',
    title: 'Venue booked',
    category: MilestoneCategory.VENDORS,
    position: 2,
  }),
  freezeSeedEntry({
    key: 'photographer_booked',
    title: 'Photographer booked',
    category: MilestoneCategory.VENDORS,
    position: 3,
  }),
  freezeSeedEntry({
    key: 'caterer_booked',
    title: 'Caterer booked',
    category: MilestoneCategory.VENDORS,
    position: 4,
  }),
  freezeSeedEntry({
    key: 'florist_booked',
    title: 'Florist booked',
    category: MilestoneCategory.VENDORS,
    position: 5,
  }),
  freezeSeedEntry({
    key: 'save_the_dates_sent',
    title: 'Save-the-dates sent',
    category: MilestoneCategory.INVITATIONS,
    position: 6,
  }),
  freezeSeedEntry({
    key: 'invitations_sent',
    title: 'Invitations sent',
    category: MilestoneCategory.INVITATIONS,
    position: 7,
  }),
  freezeSeedEntry({
    key: 'rsvps_collected',
    title: 'RSVPs collected',
    category: MilestoneCategory.INVITATIONS,
    position: 8,
  }),
  freezeSeedEntry({
    key: 'officiant_chosen',
    title: 'Officiant chosen',
    category: MilestoneCategory.LEGAL,
    position: 9,
  }),
  freezeSeedEntry({
    key: 'marriage_license_obtained',
    title: 'Marriage license obtained',
    category: MilestoneCategory.LEGAL,
    position: 10,
  }),
  freezeSeedEntry({
    key: 'final_headcount_sent',
    title: 'Final headcount sent to caterer',
    category: MilestoneCategory.FINALE,
    position: 11,
  }),
  freezeSeedEntry({
    key: 'wedding_day',
    title: 'Wedding day',
    category: MilestoneCategory.FINALE,
    position: 12,
  }),
])

export function getCanonicalMilestoneSeed(): CanonicalMilestoneSeed[] {
  return MILESTONE_SEED.map((milestone) => ({ ...milestone }))
}
