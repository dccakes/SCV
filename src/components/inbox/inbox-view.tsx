'use client'

import { Check, Copy, Mail, Paperclip, Send, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'
import { api } from '~/trpc/react'
import type { RouterOutputs } from '~/trpc/shared'

type Inbox = RouterOutputs['email']['getInbox']
type Threads = RouterOutputs['email']['listThreads']

const CATEGORY_LABELS: Record<string, string> = {
  guest_rsvp: 'Guest RSVP',
  guest_question: 'Guest question',
  vendor_contract: 'Vendor contract',
  vendor_quote: 'Vendor quote',
  vendor_general: 'Vendor',
  logistics: 'Logistics',
  spam: 'Spam',
  other: 'Other',
}

const ACTION_LABELS: Record<string, string> = {
  reply_draft: 'Draft a reply',
  forward_to_couple: 'Forward to you',
  forward_to_vendor: 'Forward to vendor',
  create_task: 'Create a task',
  log_communication: 'Log communication',
  flag_guest_question: 'Flag guest question',
  none: 'No action needed',
}

function categoryVariant(category: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (category === 'vendor_contract' || category === 'vendor_quote') return 'default'
  if (category === 'spam') return 'destructive'
  if (category.startsWith('guest')) return 'secondary'
  return 'outline'
}

function priorityVariant(priority: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (priority === 'urgent' || priority === 'high') return 'destructive'
  if (priority === 'low') return 'outline'
  return 'secondary'
}

function formatWhen(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function InboxView({
  initialInbox,
  initialThreads,
}: {
  initialInbox: Inbox
  initialThreads: Threads
}) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialThreads[0]?.id ?? null
  )

  const inboxQuery = api.email.getInbox.useQuery(undefined, { initialData: initialInbox })
  const threadsQuery = api.email.listThreads.useQuery(undefined, { initialData: initialThreads })

  const provisionInbox = api.email.provisionInbox.useMutation({
    onSuccess: () => {
      void inboxQuery.refetch()
      toast.success('Wedding email address created')
    },
    onError: (error) => toast.error(error.message || 'Could not create address'),
  })

  const inbox = inboxQuery.data
  const threads = threadsQuery.data ?? []

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <InboxAddressBar
        address={inbox?.address ?? null}
        onProvision={() => provisionInbox.mutate()}
        provisioning={provisionInbox.isPending}
      />

      <div className='grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[320px_1fr]'>
        <aside className='min-h-0 overflow-y-auto border-border border-r'>
          <ThreadList
            threads={threads}
            selectedThreadId={selectedThreadId}
            onSelect={setSelectedThreadId}
          />
        </aside>

        <section className='min-h-0 overflow-y-auto'>
          {selectedThreadId ? (
            <ThreadDetail
              threadId={selectedThreadId}
              inboxReady={Boolean(inbox)}
              onReplySent={() => void threadsQuery.refetch()}
            />
          ) : (
            <EmptyState />
          )}
        </section>
      </div>
    </div>
  )
}

function InboxAddressBar({
  address,
  onProvision,
  provisioning,
}: {
  address: string | null
  onProvision: () => void
  provisioning: boolean
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <div className='flex items-center justify-between gap-4 border-border border-b bg-muted/30 px-4 py-3'>
      <div className='flex items-center gap-2 text-sm'>
        <Mail className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
        {address ? (
          <>
            <span className='text-muted-foreground'>Your wedding email:</span>
            <span className='font-mono text-foreground'>{address}</span>
            <button
              type='button'
              onClick={copy}
              aria-label='Copy address'
              className='text-muted-foreground transition-colors hover:text-foreground'
            >
              {copied ? (
                <Check className='h-3.5 w-3.5 text-green-600' aria-hidden='true' />
              ) : (
                <Copy className='h-3.5 w-3.5' aria-hidden='true' />
              )}
            </button>
          </>
        ) : (
          <span className='text-muted-foreground'>No wedding email address yet.</span>
        )}
      </div>
      {!address && (
        <Button type='button' size='sm' onClick={onProvision} disabled={provisioning}>
          Create address
        </Button>
      )}
    </div>
  )
}

function ThreadList({
  threads,
  selectedThreadId,
  onSelect,
}: {
  threads: Threads
  selectedThreadId: string | null
  onSelect: (id: string) => void
}) {
  if (threads.length === 0) {
    return (
      <p className='p-4 text-muted-foreground text-sm'>
        No conversations yet. Share your wedding email with vendors and guests to get started.
      </p>
    )
  }

  return (
    <ul>
      {threads.map((thread) => {
        const isActive = thread.id === selectedThreadId
        return (
          <li key={thread.id}>
            <button
              type='button'
              onClick={() => onSelect(thread.id)}
              className={cn(
                'w-full border-border/60 border-b px-4 py-3 text-left transition-colors hover:bg-muted/40',
                isActive && 'bg-muted/60'
              )}
            >
              <div className='flex items-center justify-between gap-2'>
                <span className='truncate font-medium text-foreground text-sm'>
                  {thread.counterpartyName ?? thread.counterpartyEmail}
                </span>
                <span className='shrink-0 text-[0.68rem] text-muted-foreground'>
                  {formatWhen(thread.lastMessageAt)}
                </span>
              </div>
              <p className='mt-0.5 truncate text-muted-foreground text-xs'>{thread.subject}</p>
              <div className='mt-1.5'>
                <Badge variant={categoryVariant(thread.category)} className='text-[0.62rem]'>
                  {CATEGORY_LABELS[thread.category] ?? thread.category}
                </Badge>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function ThreadDetail({
  threadId,
  inboxReady,
  onReplySent,
}: {
  threadId: string
  inboxReady: boolean
  onReplySent: () => void
}) {
  const [reply, setReply] = useState('')
  const threadQuery = api.email.getThread.useQuery({ threadId })

  const sendReply = api.email.sendReply.useMutation({
    onSuccess: () => {
      setReply('')
      void threadQuery.refetch()
      onReplySent()
      toast.success('Reply sent')
    },
    onError: (error) => toast.error(error.message || 'Could not send reply'),
  })

  if (threadQuery.isLoading) {
    return <p className='p-6 text-muted-foreground text-sm'>Loading conversation…</p>
  }
  if (!threadQuery.data) {
    return <p className='p-6 text-muted-foreground text-sm'>Conversation not found.</p>
  }

  const { thread, messages } = threadQuery.data
  const latestTriage = [...messages].reverse().find((m) => m.triage)?.triage ?? null

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='border-border border-b px-6 py-4'>
        <h2 className='font-serif text-foreground text-lg'>{thread.subject}</h2>
        <p className='text-muted-foreground text-sm'>
          {thread.counterpartyName
            ? `${thread.counterpartyName} · ${thread.counterpartyEmail}`
            : thread.counterpartyEmail}
        </p>
      </div>

      {latestTriage && <TriagePanel triage={latestTriage} />}

      <div className='flex-1 space-y-4 px-6 py-4'>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      <div className='border-border border-t bg-muted/20 px-6 py-4'>
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={
            inboxReady ? 'Write a reply…' : 'Create your wedding email address to reply.'
          }
          disabled={!inboxReady || sendReply.isPending}
          rows={3}
          className='resize-none'
        />
        <div className='mt-2 flex justify-end'>
          <Button
            type='button'
            size='sm'
            onClick={() => sendReply.mutate({ threadId, body: reply.trim() })}
            disabled={!inboxReady || sendReply.isPending || reply.trim().length === 0}
          >
            <Send className='mr-2 h-3.5 w-3.5' aria-hidden='true' />
            Send reply
          </Button>
        </div>
      </div>
    </div>
  )
}

function TriagePanel({
  triage,
}: {
  triage: NonNullable<RouterOutputs['email']['getThread']['messages'][number]['triage']>
}) {
  return (
    <div className='border-border border-b bg-primary/[0.04] px-6 py-3'>
      <div className='flex items-center gap-2'>
        <Sparkles className='h-3.5 w-3.5 text-primary' aria-hidden='true' />
        <span className='font-mono text-[0.62rem] text-foreground/60 uppercase tracking-wider'>
          Etta triage
        </span>
        <Badge variant={categoryVariant(triage.category)} className='text-[0.62rem]'>
          {CATEGORY_LABELS[triage.category] ?? triage.category}
        </Badge>
        <Badge variant={priorityVariant(triage.priority)} className='text-[0.62rem]'>
          {triage.priority}
        </Badge>
      </div>
      <p className='mt-1.5 text-foreground text-sm'>{triage.summary}</p>
      {triage.suggestedActions.length > 0 && (
        <ul className='mt-2 flex flex-wrap gap-1.5'>
          {triage.suggestedActions.map((action) => (
            <li
              key={`${action.type}-${action.reason}`}
              className='rounded-full border border-border bg-background px-2.5 py-0.5 text-[0.68rem] text-muted-foreground'
              title={action.reason}
            >
              {ACTION_LABELS[action.type] ?? action.type}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MessageBubble({
  message,
}: {
  message: RouterOutputs['email']['getThread']['messages'][number]
}) {
  const outbound = message.direction === 'outbound'
  return (
    <div className={cn('flex', outbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg border px-3.5 py-2.5',
          outbound ? 'border-primary/20 bg-primary/[0.06]' : 'border-border bg-background'
        )}
      >
        <div className='mb-1 flex items-center gap-2 text-[0.68rem] text-muted-foreground'>
          <span className='font-medium text-foreground/80'>
            {outbound ? 'You' : (message.fromName ?? message.fromAddress)}
          </span>
          <span>·</span>
          <span>{formatWhen(message.createdAt)}</span>
        </div>
        <p className='whitespace-pre-wrap text-foreground text-sm'>
          {message.text ?? '(no text body)'}
        </p>
        {message.attachments.length > 0 && (
          <ul className='mt-2 space-y-1'>
            {message.attachments.map((att) => (
              <li
                key={att.url ?? `${att.filename}-${att.size}`}
                className='flex items-center gap-1.5 text-muted-foreground text-xs'
              >
                <Paperclip className='h-3 w-3' aria-hidden='true' />
                {att.url ? (
                  <a
                    href={att.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:underline'
                  >
                    {att.filename}
                  </a>
                ) : (
                  <span>{att.filename}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className='flex h-full items-center justify-center p-6'>
      <p className='text-muted-foreground text-sm'>Select a conversation to read and reply.</p>
    </div>
  )
}
