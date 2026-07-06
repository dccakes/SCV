import { TaskCategory } from '@prisma/client'

import {
  type CanonicalTaskSeed,
  getCanonicalTaskSeed,
  TASK_SEED,
} from '~/server/domains/task/task.seed'

const EXPECTED_TASKS: ReadonlyArray<CanonicalTaskSeed> = [
  {
    seedKey: 'set_wedding_budget',
    position: 0,
    monthsBeforeWedding: 12,
    category: TaskCategory.BUDGET,
    title: 'Set the wedding budget',
  },
  {
    seedKey: 'decide_rough_guest_count',
    position: 1,
    monthsBeforeWedding: 12,
    category: TaskCategory.GUESTS,
    title: 'Decide rough guest count',
  },
  {
    seedKey: 'decide_ceremony_location_region',
    position: 2,
    monthsBeforeWedding: 12,
    category: TaskCategory.VENUE,
    title: 'Decide ceremony location/region',
  },
  {
    seedKey: 'tour_ceremony_venues',
    position: 3,
    monthsBeforeWedding: 12,
    category: TaskCategory.VENUE,
    title: 'Tour ceremony venues',
  },
  {
    seedKey: 'tour_reception_venues',
    position: 4,
    monthsBeforeWedding: 12,
    category: TaskCategory.VENUE,
    title: 'Tour reception venues (if separate from ceremony)',
  },
  {
    seedKey: 'book_ceremony_venue',
    position: 5,
    monthsBeforeWedding: 12,
    category: TaskCategory.VENUE,
    title: 'Book ceremony venue',
    milestoneKey: 'venue_booked',
  },
  {
    seedKey: 'book_reception_venue',
    position: 6,
    monthsBeforeWedding: 12,
    category: TaskCategory.VENUE,
    title: 'Book reception venue (if separate)',
    milestoneKey: 'venue_booked',
  },
  {
    seedKey: 'hire_wedding_planner',
    position: 7,
    monthsBeforeWedding: 12,
    category: TaskCategory.VENDORS,
    title: 'Hire wedding planner (optional)',
  },
  {
    seedKey: 'decide_overall_vision_style',
    position: 8,
    monthsBeforeWedding: 12,
    category: TaskCategory.OTHER,
    title: 'Decide on overall vision and style',
  },
  {
    seedKey: 'start_attire_research',
    position: 9,
    monthsBeforeWedding: 12,
    category: TaskCategory.ATTIRE,
    title: 'Start research on dress / suit options',
  },
  {
    seedKey: 'finalize_guest_list_first_pass',
    position: 10,
    monthsBeforeWedding: 9,
    category: TaskCategory.GUESTS,
    title: 'Finalize guest list (first pass)',
    milestoneKey: 'guest_list_drafted',
  },
  {
    seedKey: 'book_photographer',
    position: 11,
    monthsBeforeWedding: 9,
    category: TaskCategory.VENDORS,
    title: 'Book photographer',
    milestoneKey: 'photographer_booked',
  },
  {
    seedKey: 'book_videographer',
    position: 12,
    monthsBeforeWedding: 9,
    category: TaskCategory.VENDORS,
    title: 'Book videographer (optional)',
  },
  {
    seedKey: 'book_caterer',
    position: 13,
    monthsBeforeWedding: 9,
    category: TaskCategory.VENDORS,
    title: 'Book caterer',
    milestoneKey: 'caterer_booked',
  },
  {
    seedKey: 'choose_officiant',
    position: 14,
    monthsBeforeWedding: 9,
    category: TaskCategory.CEREMONY,
    title: 'Choose officiant',
    milestoneKey: 'officiant_chosen',
  },
  {
    seedKey: 'send_save_the_dates',
    position: 15,
    monthsBeforeWedding: 9,
    category: TaskCategory.STATIONERY,
    title: 'Send save-the-dates',
    milestoneKey: 'save_the_dates_sent',
  },
  {
    seedKey: 'order_wedding_attire',
    position: 16,
    monthsBeforeWedding: 9,
    category: TaskCategory.ATTIRE,
    title: 'Order or buy wedding dress / suit',
  },
  {
    seedKey: 'book_dj_or_band',
    position: 17,
    monthsBeforeWedding: 9,
    category: TaskCategory.VENDORS,
    title: 'Book DJ or band',
  },
  {
    seedKey: 'set_up_wedding_website',
    position: 18,
    monthsBeforeWedding: 9,
    category: TaskCategory.OTHER,
    title: 'Set up wedding website',
  },
  {
    seedKey: 'block_hotel_rooms',
    position: 19,
    monthsBeforeWedding: 9,
    category: TaskCategory.GUESTS,
    title: 'Block hotel rooms for out-of-town guests',
  },
  {
    seedKey: 'book_florist',
    position: 20,
    monthsBeforeWedding: 6,
    category: TaskCategory.VENDORS,
    title: 'Book florist',
    milestoneKey: 'florist_booked',
  },
  {
    seedKey: 'book_hair_makeup_artist',
    position: 21,
    monthsBeforeWedding: 6,
    category: TaskCategory.BEAUTY,
    title: 'Book hair & makeup artist',
  },
  {
    seedKey: 'choose_wedding_party',
    position: 22,
    monthsBeforeWedding: 6,
    category: TaskCategory.OTHER,
    title: 'Choose wedding party',
  },
  {
    seedKey: 'order_wedding_party_attire',
    position: 23,
    monthsBeforeWedding: 6,
    category: TaskCategory.ATTIRE,
    title: 'Order wedding party attire',
  },
  {
    seedKey: 'plan_honeymoon',
    position: 24,
    monthsBeforeWedding: 6,
    category: TaskCategory.HONEYMOON,
    title: 'Plan honeymoon',
  },
  {
    seedKey: 'choose_ceremony_readings_music',
    position: 25,
    monthsBeforeWedding: 6,
    category: TaskCategory.CEREMONY,
    title: 'Choose ceremony readings and music',
  },
  {
    seedKey: 'order_wedding_bands',
    position: 26,
    monthsBeforeWedding: 6,
    category: TaskCategory.OTHER,
    title: 'Order wedding bands',
  },
  {
    seedKey: 'decide_invitation_design',
    position: 27,
    monthsBeforeWedding: 6,
    category: TaskCategory.STATIONERY,
    title: 'Decide on invitation design',
  },
  {
    seedKey: 'order_stationery_suite',
    position: 28,
    monthsBeforeWedding: 6,
    category: TaskCategory.STATIONERY,
    title: 'Order full stationery suite',
  },
  {
    seedKey: 'send_formal_invitations',
    position: 29,
    monthsBeforeWedding: 3,
    category: TaskCategory.STATIONERY,
    title: 'Send formal invitations',
    milestoneKey: 'invitations_sent',
  },
  {
    seedKey: 'schedule_attire_fittings',
    position: 30,
    monthsBeforeWedding: 3,
    category: TaskCategory.ATTIRE,
    title: 'Schedule dress / suit fittings',
  },
  {
    seedKey: 'write_vows',
    position: 31,
    monthsBeforeWedding: 3,
    category: TaskCategory.CEREMONY,
    title: 'Write vows',
  },
  {
    seedKey: 'plan_rehearsal_dinner',
    position: 32,
    monthsBeforeWedding: 3,
    category: TaskCategory.RECEPTION,
    title: 'Plan rehearsal dinner',
  },
  {
    seedKey: 'research_marriage_license_requirements',
    position: 33,
    monthsBeforeWedding: 3,
    category: TaskCategory.LEGAL,
    title: 'Research marriage license requirements',
  },
  {
    seedKey: 'confirm_vendor_details',
    position: 34,
    monthsBeforeWedding: 3,
    category: TaskCategory.VENDORS,
    title: 'Confirm details with all booked vendors',
  },
  {
    seedKey: 'plan_ceremony_order_timing',
    position: 35,
    monthsBeforeWedding: 3,
    category: TaskCategory.CEREMONY,
    title: 'Plan ceremony order and timing',
  },
  {
    seedKey: 'buy_wedding_rings',
    position: 36,
    monthsBeforeWedding: 3,
    category: TaskCategory.OTHER,
    title: 'Buy wedding rings (if not already done)',
  },
  {
    seedKey: 'collect_outstanding_rsvps',
    position: 37,
    monthsBeforeWedding: 1,
    category: TaskCategory.GUESTS,
    title: 'Collect outstanding RSVPs',
    milestoneKey: 'rsvps_collected',
  },
  {
    seedKey: 'send_final_headcount_to_caterer',
    position: 38,
    monthsBeforeWedding: 1,
    category: TaskCategory.RECEPTION,
    title: 'Send final headcount to caterer',
    milestoneKey: 'final_headcount_sent',
  },
  {
    seedKey: 'create_seating_chart',
    position: 39,
    monthsBeforeWedding: 1,
    category: TaskCategory.GUESTS,
    title: 'Create seating chart',
  },
  {
    seedKey: 'final_attire_fitting',
    position: 40,
    monthsBeforeWedding: 1,
    category: TaskCategory.ATTIRE,
    title: 'Final dress / suit fitting',
  },
  {
    seedKey: 'confirm_transportation_arrangements',
    position: 41,
    monthsBeforeWedding: 1,
    category: TaskCategory.OTHER,
    title: 'Confirm transportation arrangements',
  },
  {
    seedKey: 'confirm_honeymoon_details',
    position: 42,
    monthsBeforeWedding: 1,
    category: TaskCategory.HONEYMOON,
    title: 'Confirm honeymoon details',
  },
  {
    seedKey: 'get_marriage_license',
    position: 43,
    monthsBeforeWedding: 1,
    category: TaskCategory.LEGAL,
    title: 'Get marriage license',
    milestoneKey: 'marriage_license_obtained',
  },
  {
    seedKey: 'pay_remaining_vendor_balances',
    position: 44,
    monthsBeforeWedding: 1,
    category: TaskCategory.BUDGET,
    title: 'Pay remaining vendor balances',
  },
  {
    seedKey: 'pack_for_honeymoon',
    position: 45,
    monthsBeforeWedding: 1,
    category: TaskCategory.HONEYMOON,
    title: 'Pack for honeymoon',
  },
  {
    seedKey: 'confirm_vendor_arrival_times',
    position: 46,
    monthsBeforeWedding: 0,
    category: TaskCategory.VENDORS,
    title: 'Confirm vendor arrival times',
  },
  {
    seedKey: 'provide_shot_list_to_photographer',
    position: 47,
    monthsBeforeWedding: 0,
    category: TaskCategory.VENDORS,
    title: 'Provide shot list to photographer',
  },
  {
    seedKey: 'final_venue_walkthrough',
    position: 48,
    monthsBeforeWedding: 0,
    category: TaskCategory.VENUE,
    title: 'Final venue walkthrough',
  },
  {
    seedKey: 'pick_up_wedding_rings',
    position: 49,
    monthsBeforeWedding: 0,
    category: TaskCategory.OTHER,
    title: 'Pick up wedding rings',
  },
  {
    seedKey: 'break_in_wedding_shoes',
    position: 50,
    monthsBeforeWedding: 0,
    category: TaskCategory.ATTIRE,
    title: 'Break in wedding shoes (if new)',
  },
  {
    seedKey: 'wedding_rehearsal',
    position: 51,
    monthsBeforeWedding: 0,
    category: TaskCategory.CEREMONY,
    title: 'Wedding rehearsal',
  },
  {
    seedKey: 'rehearsal_dinner',
    position: 52,
    monthsBeforeWedding: 0,
    category: TaskCategory.RECEPTION,
    title: 'Rehearsal dinner',
  },
  {
    seedKey: 'pack_overnight_bag',
    position: 53,
    monthsBeforeWedding: 0,
    category: TaskCategory.OTHER,
    title: 'Pack overnight bag',
  },
  {
    seedKey: 'hair_and_makeup',
    position: 54,
    monthsBeforeWedding: 0,
    category: TaskCategory.BEAUTY,
    title: 'Hair and makeup',
  },
  {
    seedKey: 'hand_off_rings_to_officiant',
    position: 55,
    monthsBeforeWedding: 0,
    category: TaskCategory.CEREMONY,
    title: 'Hand off rings to officiant',
  },
  {
    seedKey: 'enjoy_the_day',
    position: 56,
    monthsBeforeWedding: 0,
    category: TaskCategory.OTHER,
    title: 'Enjoy the day',
  },
  {
    seedKey: 'send_thank_you_notes',
    position: 57,
    monthsBeforeWedding: -1,
    category: TaskCategory.GUESTS,
    title: 'Send thank-you notes',
  },
] as const

describe('task seed', () => {
  it('returns exactly 58 canonical tasks', () => {
    expect(getCanonicalTaskSeed()).toHaveLength(58)
    expect(TASK_SEED).toHaveLength(58)
  })

  it('matches the canonical task seed list from the approved design', () => {
    expect(getCanonicalTaskSeed()).toEqual(EXPECTED_TASKS)
    expect(TASK_SEED).toEqual(EXPECTED_TASKS)
  })

  it('has the expected category distribution and monthsBeforeWedding distribution', () => {
    const tasks = getCanonicalTaskSeed()

    const categoryDistribution = tasks.reduce<Record<TaskCategory, number>>(
      (distribution, task) => {
        distribution[task.category] = (distribution[task.category] ?? 0) + 1
        return distribution
      },
      {
        [TaskCategory.ATTIRE]: 0,
        [TaskCategory.BEAUTY]: 0,
        [TaskCategory.BUDGET]: 0,
        [TaskCategory.CEREMONY]: 0,
        [TaskCategory.GUESTS]: 0,
        [TaskCategory.HONEYMOON]: 0,
        [TaskCategory.LEGAL]: 0,
        [TaskCategory.OTHER]: 0,
        [TaskCategory.RECEPTION]: 0,
        [TaskCategory.STATIONERY]: 0,
        [TaskCategory.VENDORS]: 0,
        [TaskCategory.VENUE]: 0,
      }
    )

    const monthsDistribution = tasks.reduce<Record<number, number>>((distribution, task) => {
      distribution[task.monthsBeforeWedding] = (distribution[task.monthsBeforeWedding] ?? 0) + 1
      return distribution
    }, {})

    expect(categoryDistribution).toEqual({
      [TaskCategory.ATTIRE]: 6,
      [TaskCategory.BEAUTY]: 2,
      [TaskCategory.BUDGET]: 2,
      [TaskCategory.CEREMONY]: 6,
      [TaskCategory.GUESTS]: 6,
      [TaskCategory.HONEYMOON]: 3,
      [TaskCategory.LEGAL]: 2,
      [TaskCategory.OTHER]: 9,
      [TaskCategory.RECEPTION]: 3,
      [TaskCategory.STATIONERY]: 4,
      [TaskCategory.VENDORS]: 9,
      [TaskCategory.VENUE]: 6,
    })

    expect(monthsDistribution).toEqual({
      12: 10,
      9: 10,
      6: 9,
      3: 8,
      1: 9,
      0: 11,
      [-1]: 1,
    })
  })

  it('includes stable seed identity for every canonical default task', () => {
    const tasks = getCanonicalTaskSeed()

    expect(tasks.every((task) => task.seedKey.length > 0)).toBe(true)
    expect(new Set(tasks.map((task) => task.seedKey)).size).toBe(tasks.length)
  })

  it('returns safe copies and keeps the canonical task seed frozen', () => {
    const [canonicalTask] = TASK_SEED
    const [copiedTask] = getCanonicalTaskSeed()

    expect(Object.isFrozen(TASK_SEED)).toBe(true)
    expect(Object.isFrozen(canonicalTask)).toBe(true)

    expect(copiedTask).not.toBe(canonicalTask)
    copiedTask.title = 'Changed copy only'

    expect(getCanonicalTaskSeed()[0]?.title).toBe('Set the wedding budget')
    expect(TASK_SEED[0]?.title).toBe('Set the wedding budget')
  })
})
