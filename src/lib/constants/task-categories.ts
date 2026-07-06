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
