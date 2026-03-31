'use client'

import { useState } from 'react'
import { api } from '~/trpc/react'

type DraftComposerProps = {
  threadId: string
  to: string
  subject: string
  inReplyTo?: string
  onClose: () => void
}

export default function DraftComposer({
  threadId,
  to,
  subject,
  inReplyTo,
  onClose,
}: DraftComposerProps) {
  const [body, setBody] = useState('')

  const createDraft = api.gmail.createDraft.useMutation({
    onSuccess: () => {
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    createDraft.mutate({ threadId, to, subject, body, inReplyTo })
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-3'>
      <div className='flex items-center gap-2 font-mono text-xs text-foreground/60'>
        <span>To:</span>
        <span className='text-foreground/80'>{to}</span>
      </div>

      <div className='flex items-center gap-2 font-mono text-xs text-foreground/60'>
        <span>Subject:</span>
        <span className='text-foreground/80'>{subject}</span>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder='Write your reply...'
        rows={5}
        className='w-full resize-none rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/40 focus:outline-none'
      />

      <div className='flex items-center gap-2'>
        <button
          type='submit'
          disabled={!body.trim() || createDraft.isPending}
          className='min-h-[36px] rounded-sm bg-foreground px-4 py-1.5 font-mono text-[0.62rem] text-background uppercase tracking-widest transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 disabled:opacity-50'
        >
          {createDraft.isPending ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          type='button'
          onClick={onClose}
          className='min-h-[36px] rounded-sm border border-border px-3 py-1.5 font-mono text-[0.62rem] text-foreground/70 uppercase tracking-widest transition-colors hover:border-foreground hover:text-foreground'
        >
          Cancel
        </button>
        {createDraft.isError && (
          <span className='font-mono text-[0.6rem] text-destructive'>
            Failed to save draft. Please try again.
          </span>
        )}
        {createDraft.isSuccess && (
          <span className='font-mono text-[0.6rem] text-emerald-500'>Draft saved!</span>
        )}
      </div>
    </form>
  )
}
