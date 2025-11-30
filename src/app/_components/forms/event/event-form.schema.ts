/**
 * Event Form Schema
 *
 * Form-specific schema for react-hook-form.
 * Based on server createEventSchema - validation rules match server.
 */

import { type z } from 'zod'

import { createEventSchema } from '~/server/domains/event/event.validator'

/**
 * Form schema - same validation as server
 * Use getEventFormDefaults() for default values in useForm
 */
export const EventFormSchema = createEventSchema

export type EventFormData = z.infer<typeof EventFormSchema>

/**
 * Default values for form initialization
 */
export const getEventFormDefaults = (): Partial<EventFormData> => {
  return {
    eventName: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    attire: '',
    description: '',
  }
}

/**
 * Transform form data to server input
 * Removes empty strings to make fields truly optional
 */
export const transformToServerInput = (data: EventFormData): z.infer<typeof createEventSchema> => {
  return {
    eventName: data.eventName,
    date: data.date || undefined,
    startTime: data.startTime || undefined,
    endTime: data.endTime || undefined,
    venue: data.venue || undefined,
    attire: data.attire || undefined,
    description: data.description || undefined,
  }
}
