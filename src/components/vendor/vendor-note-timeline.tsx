'use client'

import type { VendorNote } from '~/components/vendor/vendor-enrichment-types'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function actorBadgeClass(actorType: VendorNote['actorType']) {
  return actorType === 'etta' ? 'bg-foreground/8 text-foreground/80' : 'bg-primary/10 text-primary'
}

function actorLabel(actorType: VendorNote['actorType']) {
  return actorType === 'etta' ? 'Etta' : 'Couple'
}

export function VendorNoteTimeline({ notes }: { notes: VendorNote[] }) {
  if (notes.length === 0) {
    return (
      <p className='font-mono text-[0.68rem] text-muted-foreground uppercase tracking-wider'>
        No interaction notes yet
      </p>
    )
  }

  return (
    <div className='space-y-2.5'>
      {notes.map((note) => (
        <article key={note.id} className='rounded-lg border border-border/80 bg-card/50 px-4 py-3'>
          <div className='mb-1.5 flex items-center gap-2'>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[0.54rem] uppercase tracking-wider ${actorBadgeClass(note.actorType)}`}
            >
              {actorLabel(note.actorType)}
            </span>
            <span className='font-mono text-[0.54rem] text-muted-foreground lowercase tracking-wider'>
              {dateFormatter.format(new Date(note.createdAt))}
            </span>
          </div>
          <p className='font-serif text-[0.95rem] text-foreground/85 leading-relaxed'>
            {note.message}
          </p>
        </article>
      ))}
    </div>
  )
}
