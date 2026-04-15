import type { Answer, RsvpFormResponse } from '~/app/utils/shared-types'

export interface AnswerWithType extends Answer {
  questionType: string
}

const getAnswerKey = (answer: Pick<Answer, 'questionId' | 'guestId' | 'householdId'>): string => {
  const audienceKey =
    answer.guestId != null ? `guest:${answer.guestId}` : `house:${answer.householdId ?? ''}`
  return `${answer.questionId}:${audienceKey}`
}

export const findExistingAnswer = (
  answers: AnswerWithType[],
  params: Pick<Answer, 'questionId' | 'guestId' | 'householdId'>
): AnswerWithType | undefined => {
  const key = getAnswerKey(params)
  return answers.find((answer) => getAnswerKey(answer) === key)
}

export const upsertAnswer = (
  answers: AnswerWithType[],
  incoming: AnswerWithType
): AnswerWithType[] => {
  const incomingKey = getAnswerKey(incoming)
  const hasExisting = answers.some((answer) => getAnswerKey(answer) === incomingKey)

  if (!hasExisting) return [...answers, incoming]

  return answers.map((answer) => (getAnswerKey(answer) === incomingKey ? incoming : answer))
}

export const removeAnswer = (
  answers: AnswerWithType[],
  params: Pick<Answer, 'questionId' | 'guestId' | 'householdId'>
): AnswerWithType[] => {
  const keyToRemove = getAnswerKey(params)
  return answers.filter((answer) => getAnswerKey(answer) !== keyToRemove)
}

const getRsvpKey = (response: Pick<RsvpFormResponse, 'eventId' | 'guestId'>): string => {
  return `${response.eventId}:${response.guestId}`
}

export const upsertRsvpResponses = (
  existing: RsvpFormResponse[],
  incoming: RsvpFormResponse[]
): RsvpFormResponse[] => {
  if (incoming.length === 0) return existing

  const incomingByKey = new Map(incoming.map((response) => [getRsvpKey(response), response]))
  const mergedExisting = existing.map((response) => {
    const replacement = incomingByKey.get(getRsvpKey(response))
    return replacement ?? response
  })

  const existingKeys = new Set(existing.map((response) => getRsvpKey(response)))
  const newItems = incoming.filter((response) => !existingKeys.has(getRsvpKey(response)))

  return [...mergedExisting, ...newItems]
}
