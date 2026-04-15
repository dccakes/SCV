export const analyticsEventNames = [
  'onboarding:wedding_created',
  'rsvp:submitted_public',
  'onboarding:onboarding_completed',
  'website:enabled',
  'guest:csv_imported',
] as const

export type AnalyticsEventName = (typeof analyticsEventNames)[number]

const analyticsEventNameSet = new Set<string>(analyticsEventNames)

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return analyticsEventNameSet.has(value)
}
