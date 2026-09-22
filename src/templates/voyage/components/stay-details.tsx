'use client'

import { type ReactNode, useId, useRef } from 'react'
import { headingFont, labelFont } from '~/templates/voyage/components/primitives'

/** Native top-layer dialog keeps the card size and inherited Voyage theme intact. */
export function VoyageStayDetails({ name, children }: { name: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  return (
    <>
      <button
        type='button'
        onClick={() => dialog.current?.showModal()}
        aria-haspopup='dialog'
        aria-label={`View hotel details for ${name}`}
        className={`${labelFont} flex h-14 w-full items-center justify-between gap-3 border-border border-t px-6 text-left text-[0.62rem] uppercase tracking-[0.2em] hover:text-primary`}
      >
        View hotel details{' '}
        <span aria-hidden='true' className='text-xl'>
          +
        </span>
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className='fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-[3px] border border-border bg-background p-6 text-foreground shadow-xl backdrop:bg-foreground/60 sm:p-10'
      >
        <div className='mb-6 flex items-start justify-between gap-4'>
          <h2 id={titleId} className={`${headingFont} min-w-0 break-words text-3xl`}>
            {name}
          </h2>
          <button
            type='button'
            onClick={() => dialog.current?.close()}
            className={`${labelFont} min-h-11 shrink-0 px-2 text-[0.62rem] uppercase tracking-[0.2em] hover:text-primary`}
          >
            Close
          </button>
        </div>
        {children}
      </dialog>
    </>
  )
}
