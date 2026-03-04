'use client'

import { useState } from 'react'

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

  const now = () =>
    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, time: now() }
    const ettaReply: Message = {
      id: (Date.now() + 1).toString(),
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
    <aside className='hidden lg:flex w-80 flex-shrink-0 flex-col border-l border-border bg-sidebar-ink overflow-hidden'>
      {/* Header */}
      <div className='flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3'>
        <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary font-serif italic text-lg text-white'>
          E
        </div>
        <div className='flex-1 min-w-0'>
          <p className='font-serif italic text-sidebar-cream text-[1rem] leading-tight'>Etta</p>
          <p className='font-mono text-[0.55rem] uppercase tracking-widest text-sidebar-cream/30'>
            OSWP AI Planner
          </p>
        </div>
        <span className='flex items-center gap-1.5 font-mono text-[0.55rem] text-emerald-400'>
          <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400' />
          online
        </span>
      </div>

      {/* Proactive nudge */}
      {!proactiveDismissed && (
        <div className='mx-3 mt-3 rounded-md border border-accent/20 bg-accent/10 px-3 py-2.5'>
          <p className='mb-1.5 flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-accent'>
            ✦ Etta noticed
          </p>
          <p className='font-serif text-[0.85rem] italic leading-relaxed text-sidebar-cream/75'>
            You have pending RSVPs and upcoming deadlines. Want me to help you stay on track?
          </p>
          <div className='mt-2 flex gap-2'>
            <button
              type='button'
              onClick={() => setProactiveDismissed(true)}
              className='rounded-sm bg-primary px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-widest text-primary-foreground transition-all hover:bg-accent'
            >
              Yes, help me
            </button>
            <button
              type='button'
              onClick={() => setProactiveDismissed(true)}
              className='rounded-sm border border-white/15 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-widest text-sidebar-cream/60 transition-all hover:border-accent hover:text-accent'
            >
              Remind me later
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className='flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/10'>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded px-3 py-2 font-serif text-[0.82rem] leading-relaxed ${
                msg.role === 'etta'
                  ? 'rounded-tl-none bg-white/[0.05] text-sidebar-cream/82'
                  : 'rounded-tr-none border border-primary/25 bg-primary/18 italic text-sidebar-cream/88'
              }`}
            >
              {msg.text}
            </div>
            <p
              className={`mt-1 font-mono text-[0.52rem] tracking-wider text-sidebar-cream/22 ${
                msg.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              {msg.role === 'etta' ? 'Etta' : 'You'} · {msg.time}
            </p>
          </div>
        ))}
      </div>

      {/* Suggestion chips */}
      <div className='flex flex-col gap-1.5 px-3 pb-2'>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type='button'
            onClick={() => setInput(s)}
            className='rounded border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-left font-mono text-[0.58rem] tracking-wider text-sidebar-cream/45 transition-all hover:border-accent/30 hover:bg-accent/[0.06] hover:text-accent'
          >
            &ldquo;{s}&rdquo;
          </button>
        ))}
      </div>

      {/* Input */}
      <div className='flex items-center gap-2 border-t border-white/[0.06] px-3 py-3'>
        <input
          type='text'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Ask Etta anything…'
          className='flex-1 rounded border border-white/[0.08] bg-white/[0.05] px-3 py-2 font-serif text-[0.82rem] italic text-sidebar-cream/60 outline-none placeholder:text-sidebar-cream/28 focus:border-accent/40 focus:text-sidebar-cream/85'
        />
        <button
          type='button'
          aria-label='Send'
          onClick={sendMessage}
          className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm text-white transition-colors hover:bg-accent'
        >
          →
        </button>
      </div>
    </aside>
  )
}
