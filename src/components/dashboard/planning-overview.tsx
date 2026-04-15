'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import type { DashboardData, EventWithResponses } from '~/app/utils/shared-types'
import { TaskListItem } from '~/components/dashboard/planning-overview/task-list-item'
import { useTasksCardState } from '~/components/dashboard/planning-overview/use-tasks-card-state'

interface PlanningOverviewProps {
  dashboardData: DashboardData | null
}

// CardShell action link: uses text-foreground for accessible contrast on light card bg
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
    <div className='overflow-hidden rounded-lg border border-border/90 bg-card/85'>
      <div className='flex items-center justify-between border-border border-b px-4 py-3'>
        <p className='flex items-center gap-2 font-mono text-[0.62rem] text-foreground/55 uppercase tracking-widest'>
          <span>{icon}</span>
          {title}
        </p>
        {action && actionHref && (
          <Link
            href={actionHref}
            className='font-mono text-[0.58rem] text-primary uppercase tracking-widest transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
          >
            {action}
          </Link>
        )}
      </div>
      <div className='p-4'>{children}</div>
    </div>
  )
}

function CountdownHero({ dashboardData }: { dashboardData: DashboardData | null }) {
  const weddingData = dashboardData?.weddingData
  const bride = weddingData?.brideFirstName ?? ''
  const groom = weddingData?.groomFirstName ?? ''
  const coupleName = bride && groom ? `${bride} & ${groom}` : bride || groom || 'Your Wedding'
  const hasDate = weddingData?.daysRemaining != null && weddingData.daysRemaining >= 0
  const days = hasDate ? weddingData.daysRemaining : null
  const dateLabel = weddingData?.date?.standardFormat ?? ''
  const location = weddingData?.location ?? ''

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])
  const hours = now.getHours()
  const mins = now.getMinutes()

  // Rough planning progress (placeholder — 67% until real task tracking exists)
  const planningPct = 67

  return (
    <div className='relative overflow-hidden rounded-lg bg-sidebar-ink px-6 py-5'>
      {/* decorative glow */}
      <div className='pointer-events-none absolute top-[-40px] right-[-20px] h-48 w-48 rounded-full bg-primary/20 blur-2xl' />

      <div className='relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='mb-1 font-mono text-[0.6rem] text-sidebar-cream/40 uppercase tracking-[0.18em]'>
            {hasDate ? 'Days until the big day' : 'Your wedding'}
          </p>
          <p className='font-serif text-2xl text-sidebar-cream italic leading-tight'>
            {coupleName}
          </p>
          {(dateLabel || location) && (
            <p className='mt-0.5 font-mono text-[0.62rem] text-sidebar-cream/40 tracking-wider'>
              {[dateLabel, location].filter(Boolean).join(' · ')}
            </p>
          )}
          {!hasDate && !location && (
            <p className='mt-0.5 font-mono text-[0.62rem] text-sidebar-cream/30 tracking-wider'>
              Set your date & location in{' '}
              <Link href='/settings' className='text-primary underline underline-offset-2'>
                Settings
              </Link>
            </p>
          )}
          <div className='mt-3 h-[2px] w-full max-w-[200px] overflow-hidden rounded-full bg-white/[0.08]'>
            <div
              className='h-full rounded-full bg-gradient-to-r from-primary to-accent'
              style={{ width: `${planningPct}%` }}
            />
          </div>
          <p className='mt-1 font-mono text-[0.55rem] text-sidebar-cream/30 tracking-widest'>
            {planningPct}% of planning complete
          </p>
        </div>

        {hasDate ? (
          <div className='flex items-end gap-3'>
            <div className='text-center'>
              <span className='block font-serif text-5xl text-sidebar-cream leading-none'>
                {days}
              </span>
              <span className='mt-1 block font-mono text-[0.55rem] text-sidebar-cream/30 uppercase tracking-[0.14em]'>
                Days
              </span>
            </div>
            <span className='pb-1 font-serif text-3xl text-sidebar-cream/15'>:</span>
            <div className='text-center'>
              <span className='block font-serif text-5xl text-sidebar-cream leading-none'>
                {String(hours).padStart(2, '0')}
              </span>
              <span className='mt-1 block font-mono text-[0.55rem] text-sidebar-cream/30 uppercase tracking-[0.14em]'>
                Hours
              </span>
            </div>
            <span className='pb-1 font-serif text-3xl text-sidebar-cream/15'>:</span>
            <div className='text-center'>
              <span className='block font-serif text-5xl text-sidebar-cream leading-none'>
                {String(mins).padStart(2, '0')}
              </span>
              <span className='mt-1 block font-mono text-[0.55rem] text-sidebar-cream/30 uppercase tracking-[0.14em]'>
                Mins
              </span>
            </div>
          </div>
        ) : (
          <div className='text-center'>
            <span className='block font-serif text-3xl text-sidebar-cream/30 leading-none'>
              --:--:--
            </span>
            <span className='mt-1 block font-mono text-[0.55rem] text-sidebar-cream/30 uppercase tracking-[0.14em]'>
              No date set
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function MiniStats({ dashboardData }: { dashboardData: DashboardData | null }) {
  const total = dashboardData?.totalGuests ?? 0
  const firstEvent = dashboardData?.events?.[0] as EventWithResponses | undefined
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
    <div className='grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border/90 bg-border lg:grid-cols-4'>
      {stats.map((s) => (
        <div
          key={s.label}
          className='flex items-center gap-3 bg-card/90 px-4 py-3 transition-colors hover:bg-secondary'
        >
          <span className='text-xl opacity-55'>{s.icon}</span>
          <div className='min-w-0'>
            <div className='font-serif text-[1.4rem] text-foreground leading-none'>{s.val}</div>
            <div className='font-mono text-[0.56rem] text-foreground/55 uppercase tracking-widest'>
              {s.label}
            </div>
          </div>
          {s.delta && (
            <span className='ml-auto font-mono text-[0.58rem] text-success tracking-wider'>
              {s.delta}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function RsvpCard({ dashboardData }: { dashboardData: DashboardData | null }) {
  const firstEvent = dashboardData?.events?.[0] as EventWithResponses | undefined
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
          { val: pending, label: 'Pending', color: 'text-foreground' },
          { val: declined, label: 'Declined', color: 'text-foreground/60' },
          { val: total, label: 'Invited', color: 'text-foreground' },
        ].map((s) => (
          <div key={s.label} className='px-2 text-center first:pl-0 last:pr-0'>
            <span className={`block font-serif text-[2rem] leading-none ${s.color}`}>{s.val}</span>
            <span className='font-mono text-[0.55rem] text-foreground/60 uppercase tracking-widest'>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Bar — aria-label describes the segments */}
      <div
        className='mb-2 flex h-1.5 overflow-hidden rounded-full bg-border'
        role='img'
        aria-label={`RSVP breakdown: ${Math.round(confirmedPct)}% confirmed, ${Math.round(pendingPct)}% pending, ${Math.round(declinedPct)}% declined`}
      >
        <div className='bg-success' style={{ width: `${confirmedPct}%` }} />
        <div className='bg-primary/50' style={{ width: `${pendingPct}%` }} />
        <div className='bg-foreground/30' style={{ width: `${declinedPct}%` }} />
      </div>

      <div className='mb-3 space-y-2'>
        {pending > 0 ? (
          <p className='font-mono text-[0.58rem] text-foreground/60 tracking-wider'>
            Still waiting on {pending} — check guest list for details
          </p>
        ) : null}
        <Link
          href='/settings'
          className='inline-block min-h-[44px] rounded-sm border border-border px-3 py-2.5 font-mono text-[0.58rem] text-foreground/70 uppercase tracking-widest transition-all hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
        >
          Invite collaborators
        </Link>
      </div>

      <Link
        href='/guest-list'
        className='inline-block min-h-[44px] rounded-sm border border-border px-3 py-2.5 font-mono text-[0.58rem] text-foreground/70 uppercase tracking-widest transition-all hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
      >
        Manage RSVPs →
      </Link>
    </CardShell>
  )
}

function TasksCard() {
  const { tasks, toggleTask } = useTasksCardState()

  return (
    <CardShell title='Upcoming tasks' icon='◈'>
      <div className='flex flex-col gap-1.5'>
        {tasks.map((task) => (
          <TaskListItem key={task.id} task={task} onToggle={toggleTask} />
        ))}
      </div>
      <p className='mt-3 font-mono text-[0.56rem] text-foreground/50 tracking-wider'>
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
    { name: 'Flowers', pct: 30, color: 'bg-foreground/40' },
    { name: 'Other', pct: 12, color: 'bg-border' },
  ]

  return (
    <CardShell title='Budget' icon='◧' action='Details →' actionHref='/dashboard#website-editor'>
      <div className='mb-3 flex items-baseline gap-2'>
        <span className='font-serif text-[2.2rem] text-foreground leading-none'>—</span>
        <span className='font-mono text-[0.65rem] text-foreground/60 tracking-wider'>
          Budget tracking coming soon
        </span>
      </div>
      <div className='mb-2 h-2 overflow-hidden rounded-full bg-border'>
        <div className='h-full w-0 rounded-full bg-gradient-to-r from-success to-accent' />
      </div>
      <div className='mb-4 font-mono text-[0.58rem] text-foreground/60 tracking-wider'>
        Set up your budget to track spending
      </div>
      <div className='flex flex-col gap-2'>
        {categories.map((c) => (
          <div key={c.name} className='flex items-center gap-2'>
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${c.color}`} />
            <span className='flex-1 font-serif text-[0.85rem] text-foreground'>{c.name}</span>
            <div className='h-[3px] w-14 overflow-hidden rounded-full bg-border'>
              <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
            </div>
            <span className='w-10 text-right font-mono text-[0.6rem] text-foreground/60 tracking-wider'>
              —
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  )
}

const PLACEHOLDER_VENDORS = [
  {
    initials: 'V1',
    name: 'Ceremony Venue',
    type: 'Venue',
    status: 'Confirmed',
    statusColor: 'bg-success/12 text-success',
  },
  {
    initials: 'V2',
    name: 'Photographer',
    type: 'Photography',
    status: 'Confirmed',
    statusColor: 'bg-success/12 text-success',
  },
  {
    initials: 'V3',
    name: 'Caterer',
    type: 'Catering',
    status: 'Deposit due',
    statusColor: 'bg-destructive/10 text-destructive',
  },
  {
    initials: 'V4',
    name: 'Florist',
    type: 'Flowers',
    status: 'Confirmed',
    statusColor: 'bg-success/12 text-success',
  },
  {
    initials: '—',
    name: 'Hair & Makeup',
    type: 'Beauty',
    status: 'Searching',
    statusColor: 'bg-accent/12 text-accent-foreground',
  },
]

function VendorsCard() {
  return (
    <CardShell title='Vendors' icon='◐' action='Manage →' actionHref='/vendors'>
      <div className='flex flex-col gap-1'>
        {PLACEHOLDER_VENDORS.map((v) => (
          <Link
            key={v.name}
            href='/vendors'
            className='flex min-h-[44px] items-center gap-2.5 rounded px-2 py-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
          >
            <span className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-muted font-medium font-mono text-[0.6rem] text-foreground/60 uppercase'>
              {v.initials}
            </span>
            <div className='min-w-0 flex-1'>
              <p className='truncate font-serif text-[0.88rem] text-foreground'>{v.name}</p>
              <p className='font-mono text-[0.56rem] text-foreground/60 uppercase tracking-widest'>
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
      <p className='mt-3 font-mono text-[0.56rem] text-foreground/50 tracking-wider'>
        Showing placeholder data — manage real vendors →
      </p>
    </CardShell>
  )
}

function MilestonesCard({ dashboardData }: { dashboardData: DashboardData | null }) {
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
    today: 'bg-primary border-primary shadow-[0_0_0_3px_rgba(196,99,58,0.18)]',
    upcoming: 'bg-card border-border',
  }

  return (
    <CardShell title='Milestones' icon='▷' action='Full timeline →' actionHref='/dashboard'>
      <div className='flex flex-col'>
        {allMilestones.map((m, i) => (
          <div key={m.title} className='relative flex gap-3 pb-3 last:pb-0'>
            {i < allMilestones.length - 1 && (
              <div className='absolute top-4 bottom-0 left-[5px] w-px bg-border' />
            )}
            <span
              className={`relative z-10 mt-1 h-3 w-3 flex-shrink-0 rounded-full border-2 ${dotClass[m.status]}`}
            />
            <div>
              <p
                className={`font-serif text-[0.88rem] leading-tight ${
                  'highlight' in m && m.highlight
                    ? 'font-semibold text-foreground italic'
                    : 'text-foreground'
                }`}
              >
                {m.title}
                {'highlight' in m && m.highlight ? ' ✦' : ''}
              </p>
              <p
                className={`mt-0.5 font-mono text-[0.58rem] tracking-wider ${
                  m.status === 'today' ? 'text-foreground/80' : 'text-foreground/60'
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
