export const RESERVED_WEBSITE_ROOT_SEGMENTS = [
  '',
  'api',
  'auth',
  'checklist',
  'dashboard',
  'design-system',
  'events',
  'guest-list',
  'join',
  'old_dashboard',
  'settings',
  'vendors',
  'website',
  'w',
] as const

export const reservedWebsiteRootSegmentsSet = new Set<string>(RESERVED_WEBSITE_ROOT_SEGMENTS)
