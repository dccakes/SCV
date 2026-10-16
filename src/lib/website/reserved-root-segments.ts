// Top-level app routes. The proxy never treats these as wedding website slugs,
// and websites cannot claim them.
export const RESERVED_WEBSITE_ROOT_SEGMENTS = [
  '',
  'api',
  'auth',
  'budget',
  'checklist',
  'dashboard',
  'design-system',
  'events',
  'guest-list',
  'join',
  'old_dashboard',
  'seating',
  'settings',
  'vendors',
  'website',
  'w',
] as const

export const reservedWebsiteRootSegmentsSet = new Set<string>(RESERVED_WEBSITE_ROOT_SEGMENTS)
