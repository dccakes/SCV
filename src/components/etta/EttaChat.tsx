'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'

const PLANNER_SUGGESTIONS = [
  "What's our biggest budget risk?",
  "Show me who hasn't RSVP'd yet",
  'Draft a seating plan',
]

const CONCIERGE_SUGGESTIONS = ['When is the ceremony?', 'How do I RSVP?', 'What should I wear?']

interface EttaChatProps {
  weddingId: string
  persona: 'planner' | 'concierge'
  guestToken?: string
  isConfigured?: boolean
}

type Part = UIMessage['parts'][number]

function isTextPart(p: Part): p is Extract<Part, { type: 'text' }> {
  return p.type === 'text'
}

function isReasoningPart(p: Part): p is Extract<Part, { type: 'reasoning' }> {
  return p.type === 'reasoning'
}

function isToolPart(p: Part): boolean {
  return p.type.startsWith('tool-') || p.type === 'dynamic-tool'
}

function getToolName(p: Part): string {
  if (p.type === 'dynamic-tool' && 'toolName' in p) {
    return (p as { toolName: string }).toolName
  }
  return p.type.replace('tool-', '').replaceAll('_', ' ')
}

// ── Collapsible thinking block ───────────────────────────────────────────────

function ThinkingBlock({ text, state }: { text: string; state?: 'streaming' | 'done' }) {
  const [expanded, setExpanded] = useState(false)
  const isStreaming = state === 'streaming'

  if (!text) return null

  return (
    <div className='rounded border border-white/8 bg-white/[0.03]'>
      <button
        type='button'
        onClick={() => setExpanded((v) => !v)}
        className='flex w-full items-center gap-2 px-2.5 py-1.5 text-left font-mono text-[0.6rem] text-sidebar-cream/40 uppercase tracking-widest transition-colors hover:text-sidebar-cream/60'
      >
        {isStreaming ? (
          <span className='h-1.5 w-1.5 rounded-full bg-amber-400 motion-safe:animate-pulse' />
        ) : (
          <span className='text-[0.5rem]'>{expanded ? '▾' : '▸'}</span>
        )}
        {isStreaming ? 'thinking…' : 'thought process'}
      </button>
      {(expanded || isStreaming) && (
        <div className='border-white/8 border-t px-2.5 py-2 font-mono text-[0.68rem] text-sidebar-cream/30 leading-relaxed'>
          {text}
        </div>
      )}
    </div>
  )
}

// ── Tool invocation indicator ────────────────────────────────────────────────

function ToolCallIndicator({ name }: { name: string }) {
  return (
    <div className='flex items-center gap-1.5 font-mono text-[0.6rem] text-accent/60 uppercase tracking-widest'>
      <span className='text-[0.5rem]'>⚡</span>
      {name}
    </div>
  )
}

// ── Message parts renderer ───────────────────────────────────────────────────

function MessageParts({ parts }: { parts: Part[] }) {
  const elements: React.ReactNode[] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!
    const key = `${part.type}-${i}`

    if (isReasoningPart(part)) {
      elements.push(<ThinkingBlock key={key} text={part.text} state={part.state} />)
    } else if (isTextPart(part)) {
      if (part.text) {
        elements.push(
          <div key={key} className='whitespace-pre-wrap'>
            {part.text}
          </div>
        )
      }
    } else if (isToolPart(part)) {
      elements.push(<ToolCallIndicator key={key} name={getToolName(part)} />)
    }
  }

  return <>{elements}</>
}

// ── Main chat component ──────────────────────────────────────────────────────

export function EttaChat({ persona, guestToken, isConfigured = true }: EttaChatProps) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/etta',
        body: { persona, guestToken },
      }),
    [persona, guestToken]
  )

  const { messages, sendMessage, status } = useChat({ transport })

  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const isLoading = status === 'submitted' || status === 'streaming'
  const suggestions = persona === 'planner' ? PLANNER_SUGGESTIONS : CONCIERGE_SUGGESTIONS
  const subtitle = persona === 'planner' ? 'OSWP AI Planner' : 'Wedding Concierge'
  const statusLabel = isConfigured ? 'online' : 'offline'
  const statusClassName = isConfigured ? 'text-emerald-400' : 'text-red-400'
  const statusDotClassName = isConfigured
    ? 'bg-emerald-400 motion-safe:animate-pulse'
    : 'bg-red-400'

  const messageCount = messages.length
  // biome-ignore lint/correctness/useExhaustiveDependencies: messageCount and isLoading are intentional triggers for auto-scroll
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messageCount, isLoading])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    sendMessage({ text })
  }

  function handleSuggestionClick(text: string) {
    sendMessage({ text })
  }

  return (
    <div className='flex h-full flex-col overflow-hidden bg-etta-ink'>
      {/* Header */}
      <div className='flex items-center gap-3 border-white/10 border-b px-4 py-3.5'>
        <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary font-serif text-lg text-white italic shadow-md'>
          E
        </div>
        <div className='min-w-0 flex-1'>
          <p className='font-serif text-[1rem] text-sidebar-cream italic leading-tight'>Etta</p>
          <p className='font-mono text-[0.55rem] text-sidebar-cream/32 uppercase tracking-widest'>
            {subtitle}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 font-mono text-[0.58rem] ${statusClassName}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusDotClassName}`} />
          {statusLabel}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        role='log'
        aria-live='polite'
        aria-label='Conversation with Etta'
        className='flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar]:w-[3px]'
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded px-3 py-2 font-serif text-[0.82rem] leading-relaxed ${
                msg.role === 'assistant'
                  ? 'flex flex-col gap-2 rounded-tl-none bg-white/[0.05] text-sidebar-cream/82'
                  : 'rounded-tr-none border border-primary/25 bg-primary/18 text-sidebar-cream/88 italic'
              }`}
            >
              {msg.role === 'assistant' ? (
                <MessageParts parts={msg.parts} />
              ) : (
                msg.parts
                  .filter(isTextPart)
                  .map((p) => p.text)
                  .join('')
              )}
            </div>
          </div>
        ))}

        {isLoading && messages.at(-1)?.role !== 'assistant' && (
          <div className='flex items-start'>
            <div className='rounded rounded-tl-none bg-white/[0.05] px-3 py-2 font-serif text-[0.82rem] text-sidebar-cream/50 italic'>
              <span className='inline-flex gap-1'>
                <span className='animate-bounce'>·</span>
                <span className='animate-bounce [animation-delay:150ms]'>·</span>
                <span className='animate-bounce [animation-delay:300ms]'>·</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      {messages.filter((m) => m.role === 'user').length === 0 && (
        <div className='flex flex-col gap-1.5 px-3 pb-2'>
          {suggestions.map((s) => (
            <button
              key={s}
              type='button'
              onClick={() => handleSuggestionClick(s)}
              className='min-h-[44px] rounded border border-white/7 bg-white/[0.04] px-3 py-2 text-left font-mono text-[0.58rem] text-sidebar-cream/45 tracking-wider transition-all hover:border-accent/30 hover:bg-accent/[0.06] hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-cream/80 focus-visible:ring-offset-1 focus-visible:ring-offset-etta-ink'
            >
              &ldquo;{s}&rdquo;
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className='flex items-center gap-2 border-white/10 border-t px-3 py-3'
      >
        <input
          type='text'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Ask Etta anything…'
          className='flex-1 rounded border border-white/8 bg-white/[0.05] px-3 py-2 font-serif text-[0.82rem] text-sidebar-cream/60 italic placeholder:text-sidebar-cream/28 focus:border-accent/40 focus:text-sidebar-cream/85 focus:outline-none focus:ring-2 focus:ring-accent/32'
        />
        <button
          type='submit'
          aria-label='Send'
          disabled={isLoading || !input.trim()}
          className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm text-white shadow transition-all hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-cream/80 focus-visible:ring-offset-1 focus-visible:ring-offset-etta-ink disabled:opacity-40 disabled:hover:bg-primary'
        >
          &rarr;
        </button>
      </form>
    </div>
  )
}
