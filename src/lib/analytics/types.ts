export type AnalyticsValue = string | number | boolean | null

export type AnalyticsProperties = Record<string, AnalyticsValue>

export type AnalyticsEvent = {
  event: string
  properties?: AnalyticsProperties
}

export type AnalyticsIdentifyPayload = {
  userId: string
  weddingId?: string | null
  email?: string | null
  name?: string | null
  createdAt?: string | Date | null
}

export type AnalyticsServerCapturePayload = {
  distinctId: string
  event: string
  properties?: AnalyticsProperties
}
