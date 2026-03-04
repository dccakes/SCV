'use client'

import { useRef, useState } from 'react'

interface Message {
  id: string
  role: 'etta' | 'user'
  text: string
  time: string
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'etta',
    text: "Good morning! I'm here to help you stay on top of everything. What would you like to tackle first?",
    time: '8:42am',
  },
]

const SUGGESTIONS = [
  "What's our biggest budget risk?",
  "Show me who hasn't RSVP'd yet",
  'Draft a seating plan for the top table',
]

export default function EttaPanel() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [proactiveDismissed, setProactiveDismissed] = useState(false)
  const idCounter = useRef(100)

  const nextId = () => {
    idCounter.current += 1
    return idCounter.current.toString()
  }

  const now = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return

    const userMsg: Message = { id: nextId(), role: 'user', text, time: now() }
    const ettaReply: Message = {
      id: nextId(),
      role: 'etta',
      text: "I'm processing that for you. I'll have an answer shortly — this feature is coming soon!",
      time: now(),
    }
    setMessages((prev) => [...prev, userMsg, ettaReply])
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage()
  }

  return (
    <aside className='hidden w-80 flex-shrink-0 flex-col overflow-hidden border-white/10 border-l bg-etta-ink lg:flex'>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className='flex items-center gap-3 border-white/10 border-b px-4 py-3.5'>
        <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary font-serif text-lg text-white italic shadow-md'>
          E
        </div>
        <div className='min-w-0 flex-1'>
          <p className='font-serif text-[1rem] text-sidebar-cream italic leading-tight'>Etta</p>
          <p className='font-mono text-[0.55rem] text-sidebar-cream/60 uppercase tracking-widest'>
            OSWP AI Planner
          </p>
        </div>
        <span className='flex items-center gap-1.5 font-mono text-[0.58rem] text-emerald-400'>
          <span className='h-1.5 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse' />
          online
        </span>
      </div>

      {/* ── Proactive nudge ─────────────────────────────────────────────── */}
      {!proactiveDismissed && (
        <div className='mx-3 mt-3 rounded-md border border-accent/40 bg-accent/[0.12] px-3 py-2.5'>
          <p className='mb-1.5 flex items-center gap-1.5 font-mono text-[0.58rem] text-accent uppercase tracking-widest'>
            ✦ Etta noticed
          </p>
          <p className='font-serif text-[0.85rem] text-sidebar-cream/85 italic leading-relaxed'>
            You have pending RSVPs and upcoming deadlines. Want me to help you stay on track?
          </p>
          <div className='mt-2.5 flex gap-2'>
            <button
              type='button'
              onClick={() => setProactiveDismissed(true)}
              className='min-h-[44px] rounded-sm bg-primary px-3 py-2 font-mono text-[0.58rem] text-white uppercase tracking-widest transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-cream/80 focus-visible:ring-offset-1 focus-visible:ring-offset-etta-ink'
            >
              Yes, help me
            </button>
            <button
              type='button'
              onClick={() => setProactiveDismissed(true)}
              className='min-h-[44px] rounded-sm border border-white/25 px-3 py-2 font-mono text-[0.58rem] text-sidebar-cream/75 uppercase tracking-widest transition-all hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-cream/80 focus-visible:ring-offset-1 focus-visible:ring-offset-etta-ink'
            >
              Remind me later
            </button>
          </div>
        </div>
      )}

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div
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
                msg.role === 'etta'
                  ? 'rounded-tl-none bg-white/[0.08] text-sidebar-cream/95'
                  : 'rounded-tr-none border border-primary/40 bg-primary/20 text-sidebar-cream italic'
              }`}
            >
              {msg.text}
            </div>
            <p
              className={`mt-1 font-mono text-[0.52rem] text-sidebar-cream/50 tracking-wider ${
                msg.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              {msg.role === 'etta' ? 'Etta' : 'You'} · {msg.time}
            </p>
          </div>
        ))}
      </div>

      {/* ── Suggestion chips ────────────────────────────────────────────── */}
      <div className='flex flex-col gap-1.5 px-3 pb-2'>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type='button'
            onClick={() => setInput(s)}
            className='min-h-[44px] rounded border border-white/15 bg-white/[0.05] px-3 py-2 text-left font-mono text-[0.58rem] text-sidebar-cream/70 tracking-wider transition-all hover:border-accent/50 hover:bg-accent/[0.08] hover:text-sidebar-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-cream/80 focus-visible:ring-offset-1 focus-visible:ring-offset-etta-ink'
          >
            &ldquo;{s}&rdquo;
          </button>
        ))}
      </div>

      {/* ── Input ───────────────────────────────────────────────────────── */}
      <div className='flex items-center gap-2 border-white/10 border-t px-3 py-3'>
        <input
          type='text'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Ask Etta anything…'
          className='flex-1 rounded border border-white/15 bg-white/[0.07] px-3 py-2 font-serif text-[0.82rem] text-sidebar-cream/80 italic placeholder:text-sidebar-cream/40 focus:border-accent/60 focus:text-sidebar-cream focus:outline-none focus:ring-2 focus:ring-accent/40'
        />
        <button
          type='button'
          aria-label='Send'
          onClick={sendMessage}
          className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm text-white shadow transition-all hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-cream/80 focus-visible:ring-offset-1 focus-visible:ring-offset-etta-ink'
        >
          →
        </button>
      </div>
    </aside>
  )
}
