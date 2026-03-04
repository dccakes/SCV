'use client'

import Link from 'next/link'
import { useState } from 'react'

import type { DashboardData, EventWithResponses } from '~/app/utils/shared-types'

interface PlanningOverviewProps {
  dashboardData: DashboardData
}

function CardShell({
  title,
  icon,
  action,
  actionHref,
  children,
}: {
  title: string
  icon: string
  action?: string
  actionHref?: string
  children: React.ReactNode
}) {
  return (
    <div className='rounded-lg border border-border bg-card overflow-hidden'>
      <div className='flex items-center justify-between border-b border-border px-4 py-3'>
        <p className='flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground'>
          <span>{icon}</span>
          {title}
        </p>
        {action && actionHref && (
          <Link
            href={actionHref}
            className='font-mono text-[0.58rem] uppercase tracking-widest text-primary transition-opacity hover:opacity-70'
          >
            {action}
          </Link>
        )}
      </div>
      <div className='p-4'>{children}</div>
    </div>
  )
}

function CountdownHero({ dashboardData }: { dashboardData: DashboardData }) {
  const { weddingData } = dashboardData
  const bride = weddingData?.brideFirstName ?? ''
  const groom = weddingData?.groomFirstName ?? ''
  const coupleName =
    bride && groom ? `${bride} & ${groom}` : bride || groom || 'Your Wedding'
  const days = weddingData?.daysRemaining ?? 0
  const dateLabel = weddingData?.date?.standardFormat ?? ''

  const hours = new Date().getHours()
  const mins = new Date().getMinutes()

  // Rough planning progress (placeholder — 67% until real task tracking exists)
  const planningPct = 67

  return (
    <div className='relative overflow-hidden rounded-lg bg-sidebar-ink px-6 py-5'>
      {/* decorative glow */}
      <div className='pointer-events-none absolute right-[-20px] top-[-40px] h-48 w-48 rounded-full bg-primary/20 blur-2xl' />

      <div className='relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='mb-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-sidebar-cream/40'>
            Days until the big day
          </p>
          <p className='font-serif text-2xl italic leading-tight text-sidebar-cream'>{coupleName}</p>
          {dateLabel && (
            <p className='mt-0.5 font-mono text-[0.62rem] tracking-wider text-sidebar-cream/40'>
              {dateLabel}
            </p>
          )}
          <div className='mt-3 h-[2px] w-full max-w-[200px] overflow-hidden rounded-full bg-white/[0.08]'>
            <div
              className='h-full rounded-full bg-gradient-to-r from-primary to-accent'
              style={{ width: `${planningPct}%` }}
            />
          </div>
          <p className='mt-1 font-mono text-[0.55rem] tracking-widest text-sidebar-cream/30'>
            {planningPct}% of planning complete
          </p>
        </div>

        <div className='flex items-end gap-3'>
          <div className='text-center'>
            <span className='block font-serif text-5xl leading-none text-sidebar-cream'>{days}</span>
            <span className='mt-1 block font-mono text-[0.55rem] uppercase tracking-[0.14em] text-sidebar-cream/30'>
              Days
            </span>
          </div>
          <span className='pb-1 font-serif text-3xl text-sidebar-cream/15'>:</span>
          <div className='text-center'>
            <span className='block font-serif text-5xl leading-none text-sidebar-cream'>
              {String(hours).padStart(2, '0')}
            </span>
            <span className='mt-1 block font-mono text-[0.55rem] uppercase tracking-[0.14em] text-sidebar-cream/30'>
              Hours
            </span>
          </div>
          <span className='pb-1 font-serif text-3xl text-sidebar-cream/15'>:</span>
          <div className='text-center'>
            <span className='block font-serif text-5xl leading-none text-sidebar-cream'>
              {String(mins).padStart(2, '0')}
            </span>
            <span className='mt-1 block font-mono text-[0.55rem] uppercase tracking-[0.14em] text-sidebar-cream/30'>
              Mins
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniStats({ dashboardData }: { dashboardData: DashboardData }) {
  const total = dashboardData?.totalGuests ?? 0
  const firstEvent = (dashboardData?.events?.[0] as EventWithResponses | undefined)
  const confirmed = firstEvent?.guestResponses?.attending ?? 0
  const pending = firstEvent?.guestResponses?.invited ?? 0
  const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0

  const stats = [
    { icon: '◉', val: total, label: 'Total guests', delta: null },
    { icon: '✓', val: confirmed, label: 'Confirmed', delta: `${pct}%` },
    { icon: '◐', val: pending, label: 'Awaiting reply', delta: null },
    { icon: '◧', val: '—', label: 'Budget spent', delta: 'Set up budget' },
  ]

  return (
    <div className='grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4'>
      {stats.map((s) => (
        <div
          key={s.label}
          className='flex items-center gap-3 bg-card px-4 py-3 transition-colors hover:bg-muted'
        >
          <span className='text-xl opacity-60'>{s.icon}</span>
          <div className='min-w-0'>
            <div className='font-serif text-[1.4rem] leading-none text-foreground'>{s.val}</div>
            <div className='font-mono text-[0.56rem] uppercase tracking-widest text-muted-foreground'>
              {s.label}
            </div>
          </div>
          {s.delta && (
            <span className='ml-auto font-mono text-[0.58rem] tracking-wider text-success'>
              {s.delta}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function RsvpCard({ dashboardData }: { dashboardData: DashboardData }) {
  const firstEvent = (dashboardData?.events?.[0] as EventWithResponses | undefined)
  const attending = firstEvent?.guestResponses?.attending ?? 0
  const pending = firstEvent?.guestResponses?.invited ?? 0
  const declined = firstEvent?.guestResponses?.declined ?? 0
  const total = attending + pending + declined

  const confirmedPct = total > 0 ? (attending / total) * 100 : 0
  const pendingPct = total > 0 ? (pending / total) * 100 : 0
  const declinedPct = total > 0 ? (declined / total) * 100 : 0

  return (
    <CardShell title='RSVP Status' icon='◉' action='View all →' actionHref='/guest-list'>
      {/* Counts */}
      <div className='mb-3 grid grid-cols-4 divide-x divide-border'>
        {[
          { val: attending, label: 'Confirmed', color: 'text-success' },
          { val: pending, label: 'Pending', color: 'text-primary' },
          { val: declined, label: 'Declined', color: 'text-muted-foreground' },
          { val: total, label: 'Invited', color: 'text-foreground' },
        ].map((s) => (
          <div key={s.label} className='px-2 text-center first:pl-0 last:pr-0'>
            <span className={`block font-serif text-[2rem] leading-none ${s.color}`}>{s.val}</span>
            <span className='font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground'>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Bar */}
      <div className='mb-2 flex h-1.5 overflow-hidden rounded-full bg-border'>
        <div className='bg-success' style={{ width: `${confirmedPct}%` }} />
        <div className='bg-primary/50' style={{ width: `${pendingPct}%` }} />
        <div className='bg-muted-foreground/30' style={{ width: `${declinedPct}%` }} />
      </div>

      {pending > 0 && (
        <p className='mb-3 font-mono text-[0.58rem] tracking-wider text-muted-foreground'>
          Still waiting on {pending} — check guest list for details
        </p>
      )}

      <Link
        href='/guest-list'
        className='inline-block rounded-sm border border-primary/30 px-3 py-1 font-mono text-[0.58rem] uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground'
      >
        Manage RSVPs →
      </Link>
    </CardShell>
  )
}

interface TaskItem {
  id: string
  text: string
  tag: string
  due: string
  done: boolean
  urgent: boolean
}

const PLACEHOLDER_TASKS: TaskItem[] = [
  { id: '1', text: 'Book ceremony venue', tag: 'Vendor', due: 'Done', done: true, urgent: false },
  { id: '2', text: 'Finalise guest list (first pass)', tag: 'Admin', due: 'Done', done: true, urgent: false },
  { id: '3', text: 'Confirm catering headcount', tag: 'Urgent', due: 'This week', done: false, urgent: true },
  { id: '4', text: 'Pay rehearsal dinner deposit', tag: 'Overdue', due: 'Overdue', done: false, urgent: true },
  { id: '5', text: 'Book hair & makeup artist', tag: 'Vendor', due: 'Mar 20', done: false, urgent: false },
  { id: '6', text: 'Finalise ceremony music playlist', tag: 'Admin', due: 'Apr 1', done: false, urgent: false },
]

function TasksCard() {
  const [tasks, setTasks] = useState<TaskItem[]>(PLACEHOLDER_TASKS)

  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const tagClass: Record<string, string> = {
    Vendor: 'bg-success/12 text-success',
    Admin: 'bg-accent/12 text-accent-foreground',
    Urgent: 'bg-primary/10 text-primary',
    Overdue: 'bg-destructive/10 text-destructive',
  }

  return (
    <CardShell title='Upcoming tasks' icon='◈'>
      <div className='flex flex-col gap-1.5'>
        {tasks.map((task) => (
          <button
            type='button'
            key={task.id}
            onClick={() => toggle(task.id)}
            className='flex w-full items-center gap-2.5 rounded px-2 py-2 text-left transition-colors hover:bg-muted'
          >
            <span
              className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-sm border text-[0.55rem] transition-all ${
                task.done
                  ? 'border-success bg-success text-white'
                  : 'border-border hover:border-success/70'
              }`}
            >
              {task.done && '✓'}
            </span>
            <span
              className={`flex-1 font-serif text-[0.9rem] leading-tight ${
                task.done ? 'text-muted-foreground line-through decoration-muted-foreground/40' : 'text-foreground'
              }`}
            >
              {task.text}
            </span>
            <span
              className={`flex-shrink-0 rounded-full px-2 py-0.5 font-mono text-[0.52rem] uppercase tracking-wider ${tagClass[task.tag] ?? 'bg-muted text-muted-foreground'}`}
            >
              {task.tag}
            </span>
            <span
              className={`flex-shrink-0 font-mono text-[0.56rem] tracking-wider ${task.urgent ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {task.due}
            </span>
          </button>
        ))}
      </div>
      <p className='mt-3 font-mono text-[0.56rem] tracking-wider text-muted-foreground/60'>
        Task tracking coming soon — these are placeholders
      </p>
    </CardShell>
  )
}

function BudgetCard() {
  const categories = [
    { name: 'Venue', pct: 90, color: 'bg-success' },
    { name: 'Catering', pct: 60, color: 'bg-accent' },
    { name: 'Photography', pct: 45, color: 'bg-primary' },
    { name: 'Flowers', pct: 30, color: 'bg-muted-foreground' },
    { name: 'Other', pct: 12, color: 'bg-border' },
  ]

  return (
    <CardShell title='Budget' icon='◧' action='Details →' actionHref='/dashboard#website-editor'>
      <div className='mb-3 flex items-baseline gap-2'>
        <span className='font-serif text-[2.2rem] leading-none text-foreground'>—</span>
        <span className='font-mono text-[0.65rem] tracking-wider text-muted-foreground'>
          Budget tracking coming soon
        </span>
      </div>
      <div className='mb-2 h-2 overflow-hidden rounded-full bg-border'>
        <div className='h-full w-0 rounded-full bg-gradient-to-r from-success to-accent' />
      </div>
      <div className='mb-4 font-mono text-[0.58rem] tracking-wider text-muted-foreground'>
        Set up your budget to track spending
      </div>
      <div className='flex flex-col gap-2'>
        {categories.map((c) => (
          <div key={c.name} className='flex items-center gap-2'>
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${c.color}`} />
            <span className='flex-1 font-serif text-[0.85rem] text-foreground'>{c.name}</span>
            <div className='w-14 overflow-hidden rounded-full h-[3px] bg-border'>
              <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
            </div>
            <span className='w-10 text-right font-mono text-[0.6rem] tracking-wider text-muted-foreground'>
              —
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  )
}

function VendorsCard() {
  const placeholderVendors = [
    { initials: 'V1', name: 'Ceremony Venue', type: 'Venue', status: 'Confirmed', statusColor: 'bg-success/12 text-success' },
    { initials: 'V2', name: 'Photographer', type: 'Photography', status: 'Confirmed', statusColor: 'bg-success/12 text-success' },
    { initials: 'V3', name: 'Caterer', type: 'Catering', status: 'Deposit due', statusColor: 'bg-destructive/10 text-destructive' },
    { initials: 'V4', name: 'Florist', type: 'Flowers', status: 'Confirmed', statusColor: 'bg-success/12 text-success' },
    { initials: '—', name: 'Hair & Makeup', type: 'Beauty', status: 'Searching', statusColor: 'bg-accent/12 text-accent-foreground' },
  ]

  return (
    <CardShell title='Vendors' icon='◐' action='Manage →' actionHref='/vendors'>
      <div className='flex flex-col gap-1'>
        {placeholderVendors.map((v) => (
          <Link
            key={v.name}
            href='/vendors'
            className='flex items-center gap-2.5 rounded px-2 py-2 transition-colors hover:bg-muted'
          >
            <span className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-muted font-mono text-[0.6rem] font-medium uppercase text-muted-foreground'>
              {v.initials}
            </span>
            <div className='min-w-0 flex-1'>
              <p className='truncate font-serif text-[0.88rem] text-foreground'>{v.name}</p>
              <p className='font-mono text-[0.56rem] uppercase tracking-widest text-muted-foreground'>
                {v.type}
              </p>
            </div>
            <span
              className={`flex-shrink-0 rounded-full px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider ${v.statusColor}`}
            >
              {v.status}
            </span>
          </Link>
        ))}
      </div>
      <p className='mt-3 font-mono text-[0.56rem] tracking-wider text-muted-foreground/60'>
        Showing placeholder data — manage real vendors →
      </p>
    </CardShell>
  )
}

function MilestonesCard({ dashboardData }: { dashboardData: DashboardData }) {
  const weddingDateLabel = dashboardData?.weddingData?.date?.standardFormat ?? ''
  const events = dashboardData?.events ?? []

  const staticMilestones = [
    { title: 'Venue booked', date: 'Jan 2026', status: 'done' as const },
    { title: 'Invitations sent', date: 'Feb 2026', status: 'done' as const },
    { title: 'RSVP deadline', date: 'Mar 2026', status: 'today' as const },
    { title: 'Final headcount to caterer', date: 'Apr 2026', status: 'upcoming' as const },
    { title: 'Seating plan finalised', date: 'Jan 2027', status: 'upcoming' as const },
    { title: 'Rehearsal dinner', date: 'Day before', status: 'upcoming' as const },
  ]

  const weddingMilestone = {
    title: events[0]?.name ?? 'The wedding',
    date: weddingDateLabel,
    status: 'upcoming' as const,
    highlight: true,
  }

  const allMilestones = [...staticMilestones, weddingMilestone]

  const dotClass = {
    done: 'bg-success border-success',
    today: 'bg-primary border-primary shadow-[0_0_0_3px_rgba(var(--primary),0.15)]',
    upcoming: 'bg-card border-border',
  }

  return (
    <CardShell title='Milestones' icon='▷' action='Full timeline →' actionHref='/dashboard'>
      <div className='flex flex-col'>
        {allMilestones.map((m, i) => (
          <div key={m.title} className='relative flex gap-3 pb-3 last:pb-0'>
            {i < allMilestones.length - 1 && (
              <div className='absolute left-[5px] top-4 bottom-0 w-px bg-border' />
            )}
            <span
              className={`relative z-10 mt-1 h-3 w-3 flex-shrink-0 rounded-full border-2 ${dotClass[m.status]}`}
            />
            <div>
              <p
                className={`font-serif text-[0.88rem] leading-tight ${
                  'highlight' in m && m.highlight ? 'italic text-primary' : 'text-foreground'
                }`}
              >
                {m.title}{'highlight' in m && m.highlight ? ' ✦' : ''}
              </p>
              <p
                className={`mt-0.5 font-mono text-[0.58rem] tracking-wider ${
                  m.status === 'today' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {m.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  )
}

export default function PlanningOverview({ dashboardData }: PlanningOverviewProps) {
  return (
    <div className='flex flex-col gap-5'>
      {/* Countdown hero */}
      <CountdownHero dashboardData={dashboardData} />

      {/* Mini stats */}
      <MiniStats dashboardData={dashboardData} />

      {/* Row: RSVP + Tasks */}
      <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
        <RsvpCard dashboardData={dashboardData} />
        <TasksCard />
      </div>

      {/* Row: Budget + Vendors + Milestones */}
      <div className='grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'>
        <BudgetCard />
        <VendorsCard />
        <MilestonesCard dashboardData={dashboardData} />
      </div>
    </div>
  )
}
