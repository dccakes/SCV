export const TASK_CATEGORIES = [
  'VENUE',
  'VENDORS',
  'ATTIRE',
  'STATIONERY',
  'GUESTS',
  'LEGAL',
  'CEREMONY',
  'RECEPTION',
  'BEAUTY',
  'HONEYMOON',
  'BUDGET',
  'OTHER',
] as const

export type TaskCategoryValue = (typeof TASK_CATEGORIES)[number]

export const TASK_CATEGORY_LABELS: Record<TaskCategoryValue, string> = {
  VENUE: 'Venue',
  VENDORS: 'Vendor',
  ATTIRE: 'Attire',
  STATIONERY: 'Stationery',
  GUESTS: 'Guests',
  LEGAL: 'Legal',
  CEREMONY: 'Ceremony',
  RECEPTION: 'Reception',
  BEAUTY: 'Beauty',
  HONEYMOON: 'Honeymoon',
  BUDGET: 'Budget',
  OTHER: 'Other',
}
