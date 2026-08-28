'use client'

import { GuestDetailSection } from '~/components/guest-list/v2/drawer/guest-detail-sections'
import { Badge } from '~/components/ui/badge'
import type { RouterOutputs } from '~/trpc/shared'

type HouseholdAnswers = RouterOutputs['question']['getAnswersByHousehold']

type AnswersSectionProps = {
  answers: HouseholdAnswers
  isLoading?: boolean
}

export function AnswersSection({ answers, isLoading = false }: Readonly<AnswersSectionProps>) {
  return (
    <GuestDetailSection title='RSVP Answers'>
      {isLoading ? (
        <p className='text-foreground/60 text-sm'>Loading answers…</p>
      ) : answers.length === 0 ? (
        <p className='text-foreground/60 text-sm leading-relaxed'>
          This household hasn&apos;t answered any RSVP questions yet.
        </p>
      ) : (
        <ul className='space-y-3'>
          {answers.map((group) => (
            <li key={group.questionId} className='space-y-1'>
              <div className='flex items-center gap-2'>
                <p className='font-medium text-foreground text-sm'>{group.questionText}</p>
                {group.scope === 'event' ? (
                  <Badge variant='outline' className='text-[0.6rem]'>
                    Event
                  </Badge>
                ) : null}
              </div>
              <ul className='space-y-1'>
                {group.responses.map((response) => (
                  <li key={response.key} className='text-foreground/80 text-sm leading-relaxed'>
                    {response.guestName ? (
                      <span className='font-mono text-[0.62rem] text-foreground/55 uppercase tracking-wider'>
                        {response.guestName}:{' '}
                      </span>
                    ) : null}
                    {response.answer}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </GuestDetailSection>
  )
}
