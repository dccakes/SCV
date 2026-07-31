'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { DashboardData, EventWithResponses } from '~/app/utils/shared-types'
import { formatCurrency } from '~/components/budget/format'
import { TaskDialog } from '~/components/checklist/task-dialog'
import { TaskListItem } from '~/components/dashboard/planning-overview/task-list-item'
import { useTasksCardState } from '~/components/dashboard/planning-overview/use-tasks-card-state'
import { DASHBOARD_ADD_TASK_EVENT } from '~/components/dashboard/task-dialog-events'
import type { EventWithStats } from '~/server/domains/event'
import { api } from '~/trpc/react'

type DashboardOverview = NonNullable<DashboardData>

const EMPTY_PRIORITY_TASKS: DashboardOverview['taskPriorityQueue']['tasks'] = []

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

  const milestones = dashboardData?.milestones ?? []
  const completedMilestones = milestones.filter((milestone) => milestone.effectiveStatus === 'done')
  const planningPct =
    milestones.length > 0 ? Math.round((completedMilestones.length / milestones.length) * 100) : 0

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
          <div className='text-center'>
            <span className='block font-serif text-6xl text-sidebar-cream leading-none'>
              {days}
            </span>
            <span className='mt-1 block font-mono text-[0.55rem] text-sidebar-cream/30 uppercase tracking-[0.14em]'>
              Days
            </span>
          </div>
        ) : (
          <div className='text-center'>
            <span className='block font-serif text-5xl text-sidebar-cream/30 leading-none'>—</span>
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
  const rsvpSummary = (dashboardData?.events ?? []).reduce(
    (acc, event) => {
      const eventWithResponses = event as EventWithResponses
      if (!eventWithResponses.collectRsvp) return acc
      acc.confirmed += eventWithResponses.guestResponses?.attending ?? 0
      acc.pending += eventWithResponses.guestResponses?.invited ?? 0
      acc.declined += eventWithResponses.guestResponses?.declined ?? 0
      return acc
    },
    { confirmed: 0, pending: 0, declined: 0 }
  )
  const confirmed = rsvpSummary.confirmed
  const pending = rsvpSummary.pending
  const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0

  const stats = [
    { icon: '◉', val: total, label: 'Total guests', delta: null, href: '/guest-list' },
    { icon: '✓', val: confirmed, label: 'Confirmed', delta: `${pct}%`, href: '/guest-list' },
    { icon: '◐', val: pending, label: 'Awaiting reply', delta: null, href: '/guest-list' },
    {
      icon: '◧',
      val: dashboardData?.tasksDueThisMonth ?? 0,
      label: 'Tasks due this month',
      delta: null,
      href: '/checklist',
    },
  ]

  return (
    <div className='grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border/90 bg-border lg:grid-cols-4'>
      {stats.map((s) => (
        <Link
          key={s.label}
          href={s.href}
          className='flex items-center gap-3 bg-card/90 px-4 py-3 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/50'
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
        </Link>
      ))}
    </div>
  )
}

function RsvpCard({ dashboardData }: { dashboardData: DashboardData | null }) {
  const rsvpSummary = (dashboardData?.events ?? []).reduce(
    (acc, event) => {
      const eventWithResponses = event as EventWithResponses
      if (!eventWithResponses.collectRsvp) return acc
      acc.attending += eventWithResponses.guestResponses?.attending ?? 0
      acc.pending += eventWithResponses.guestResponses?.invited ?? 0
      acc.declined += eventWithResponses.guestResponses?.declined ?? 0
      return acc
    },
    { attending: 0, pending: 0, declined: 0 }
  )
  const attending = rsvpSummary.attending
  const pending = rsvpSummary.pending
  const declined = rsvpSummary.declined
  const total = attending + pending + declined

  if (total === 0) {
    return (
      <CardShell title='RSVP Status' icon='◉'>
        <div className='flex flex-col gap-3'>
          <div className='flex items-baseline gap-2'>
            <span className='font-serif text-[2.2rem] text-foreground/30 leading-none'>—</span>
            <span className='font-mono text-[0.65rem] text-foreground/60 tracking-wider'>
              No RSVPs collected yet
            </span>
          </div>
          <div className='font-mono text-[0.58rem] text-foreground/60 tracking-wider'>
            Enable RSVP collection on one of your events to start tracking responses
          </div>
          <Link
            href='/events'
            className='inline-block min-h-[44px] rounded-sm border border-border px-3 py-2.5 font-mono text-[0.58rem] text-foreground/70 uppercase tracking-widest transition-all hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
          >
            Set up RSVPs →
          </Link>
        </div>
      </CardShell>
    )
  }

  const confirmedPct = (attending / total) * 100
  const pendingPct = (pending / total) * 100
  const declinedPct = (declined / total) * 100

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

      {pending > 0 && (
        <p className='mb-3 font-mono text-[0.58rem] text-foreground/60 tracking-wider'>
          Still waiting on {pending} — check guest list for details
        </p>
      )}

      <Link
        href='/guest-list'
        className='inline-block min-h-[44px] rounded-sm border border-border px-3 py-2.5 font-mono text-[0.58rem] text-foreground/70 uppercase tracking-widest transition-all hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
      >
        Manage RSVPs →
      </Link>
    </CardShell>
  )
}

function TasksCard({ dashboardData }: { dashboardData: DashboardData | null }) {
  const priorityQueue = dashboardData?.taskPriorityQueue
  const { tasks, toggleTask } = useTasksCardState(priorityQueue?.tasks ?? EMPTY_PRIORITY_TASKS)
  const completeTask = api.task.complete.useMutation({
    onError: () => toast.error('Failed to update task'),
  })

  const handleToggle = (taskId: string) => {
    toggleTask(taskId)
    const targetTask = tasks.find((task) => task.id === taskId)

    completeTask.mutate({
      taskId,
      completed: !(targetTask?.done ?? false),
    })
  }

  return (
    <CardShell title='Upcoming tasks' icon='◈' action='View all →' actionHref='/checklist'>
      {tasks.length > 0 ? (
        <>
          <div className='flex flex-col gap-1.5'>
            {tasks.map((task) => (
              <TaskListItem key={task.id} task={task} onToggle={handleToggle} />
            ))}
          </div>
          <p className='mt-3 font-mono text-[0.56rem] text-foreground/50 tracking-wider'>
            {tasks.length} of {priorityQueue?.totalActive ?? 0} active tasks shown
          </p>
        </>
      ) : (
        <div className='flex flex-col gap-3'>
          <div className='flex items-baseline gap-2'>
            <span className='font-serif text-[2.2rem] text-foreground/30 leading-none'>—</span>
            <span className='font-mono text-[0.65rem] text-foreground/60 tracking-wider'>
              No active tasks yet
            </span>
          </div>
          <div className='font-mono text-[0.58rem] text-foreground/60 tracking-wider'>
            Create your first planning task to stay on top of wedding prep
          </div>
          <Link
            href='/checklist'
            className='inline-block min-h-[44px] rounded-sm border border-border px-3 py-2.5 font-mono text-[0.58rem] text-foreground/70 uppercase tracking-widest transition-all hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
          >
            Go to checklist →
          </Link>
        </div>
      )}
    </CardShell>
  )
}

function BudgetCard() {
  const { data: overview } = api.budget.getOverview.useQuery()

  const hasTarget = (overview?.targetTotal ?? 0) > 0
  const hasCategories = (overview?.categories.length ?? 0) > 0
  const hasBudget = hasTarget || hasCategories

  if (!hasBudget) {
    return (
      <CardShell title='Budget' icon='◧' action='Manage →' actionHref='/budget'>
        <div className='flex flex-col gap-3'>
          <div className='flex items-baseline gap-2'>
            <span className='font-serif text-[2.2rem] text-foreground/30 leading-none'>—</span>
            <span className='font-mono text-[0.65rem] text-foreground/60 tracking-wider'>
              No budget set up yet
            </span>
          </div>
          <div className='font-mono text-[0.58rem] text-foreground/60 tracking-wider'>
            Track your wedding spending against a target budget
          </div>
          <Link
            href='/budget'
            className='inline-block min-h-[44px] rounded-sm border border-border px-3 py-2.5 font-mono text-[0.58rem] text-foreground/70 uppercase tracking-widest transition-all hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
          >
            Set up your budget →
          </Link>
        </div>
      </CardShell>
    )
  }

  const currency = overview!.currency
  const { netSpend, remaining, actualSpend } = overview!.summary
  const target = overview!.targetTotal
  const categoryCount = overview!.categories.length
  const pct = target > 0 ? Math.min(100, Math.round((netSpend / target) * 100)) : 0
  const overBudget = target > 0 && netSpend > target

  return (
    <CardShell title='Budget' icon='◧' action='Manage →' actionHref='/budget'>
      <div className='flex flex-col gap-3'>
        <div className='flex items-baseline gap-2'>
          <span className='font-serif text-[2.2rem] text-foreground leading-none'>
            {formatCurrency(netSpend, currency)}
          </span>
          <span className='font-mono text-[0.65rem] text-foreground/60 tracking-wider'>
            {target > 0 ? `of ${formatCurrency(target, currency)}` : 'net spend'}
          </span>
        </div>
        {target > 0 && (
          <div
            className='h-1.5 overflow-hidden rounded-full bg-border'
            role='img'
            aria-label={`${pct}% of budget used`}
          >
            <div
              className={`h-full rounded-full transition-all ${overBudget ? 'bg-destructive' : 'bg-gradient-to-r from-success to-accent'}`}
              style={{ width: `${pct > 0 ? Math.max(2, pct) : 0}%` }}
            />
          </div>
        )}
        <div className='grid grid-cols-3 divide-x divide-border text-center'>
          {[
            {
              val: formatCurrency(actualSpend, currency),
              label: 'Spent',
              color: 'text-foreground',
            },
            {
              val: target > 0 ? formatCurrency(remaining, currency) : String(categoryCount),
              label: target > 0 ? 'Remaining' : `Section${categoryCount !== 1 ? 's' : ''}`,
              color: overBudget ? 'text-destructive' : 'text-foreground',
            },
            {
              val: target > 0 ? `${pct}%` : '—',
              label: target > 0 ? 'Of target' : 'No target',
              color: 'text-foreground/60',
            },
          ].map((s) => (
            <div key={s.label} className='px-2 first:pl-0 last:pr-0'>
              <span className={`block font-serif text-[1.1rem] leading-none ${s.color}`}>
                {s.val}
              </span>
              <span className='font-mono text-[0.52rem] text-foreground/55 uppercase tracking-widest'>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  )
}

function VendorsCard() {
  const { data: vendors } = api.vendor.getAll.useQuery({})

  const vendorCount = vendors?.length ?? 0
  const selected = vendors?.filter((v) => v.status === 'SELECTED').length ?? 0
  const inProgress =
    vendors?.filter((v) => v.status === 'IN_NEGOTIATION' || v.status === 'PRE_SELECTED').length ?? 0
  const inReview = vendors?.filter((v) => v.status === 'IN_REVIEW').length ?? 0

  if (vendorCount === 0) {
    return (
      <CardShell title='Vendors' icon='◐' action='Manage →' actionHref='/vendors'>
        <div className='flex flex-col gap-3'>
          <div className='flex items-baseline gap-2'>
            <span className='font-serif text-[2.2rem] text-foreground/30 leading-none'>—</span>
            <span className='font-mono text-[0.65rem] text-foreground/60 tracking-wider'>
              No vendors added yet
            </span>
          </div>
          <div className='font-mono text-[0.58rem] text-foreground/60 tracking-wider'>
            Track quotes, contacts, and contracts in one place
          </div>
          <Link
            href='/vendors'
            className='inline-block min-h-[44px] rounded-sm border border-border px-3 py-2.5 font-mono text-[0.58rem] text-foreground/70 uppercase tracking-widest transition-all hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
          >
            Add your first vendor →
          </Link>
        </div>
      </CardShell>
    )
  }

  return (
    <CardShell title='Vendors' icon='◐' action='Manage →' actionHref='/vendors'>
      <div className='flex flex-col gap-3'>
        <div className='flex items-baseline gap-2'>
          <span className='font-serif text-[2.2rem] text-foreground leading-none'>
            {vendorCount}
          </span>
          <span className='font-mono text-[0.65rem] text-foreground/60 tracking-wider'>
            vendor{vendorCount !== 1 ? 's' : ''} tracked
          </span>
        </div>
        <div className='grid grid-cols-3 divide-x divide-border text-center'>
          {[
            { val: selected, label: 'Selected', color: 'text-success' },
            { val: inProgress, label: 'In Progress', color: 'text-foreground' },
            { val: inReview, label: 'In Review', color: 'text-foreground/60' },
          ].map((s) => (
            <div key={s.label} className='px-2 first:pl-0 last:pr-0'>
              <span className={`block font-serif text-[1.6rem] leading-none ${s.color}`}>
                {s.val}
              </span>
              <span className='font-mono text-[0.52rem] text-foreground/55 uppercase tracking-widest'>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  )
}

function MilestonesCard({ dashboardData }: { dashboardData: DashboardData | null }) {
  const weddingDateLabel = dashboardData?.weddingData?.date?.standardFormat ?? ''
  const milestones = dashboardData?.milestones ?? []
  const doneMilestones = milestones.filter((milestone) => milestone.effectiveStatus === 'done')
  const pendingMilestones = milestones.filter(
    (milestone) => milestone.effectiveStatus === 'pending'
  )
  const visibleMilestones = dedupeMilestones([
    ...doneMilestones.slice(-2),
    ...pendingMilestones.slice(0, 3),
    ...milestones.filter((milestone) => milestone.key === 'wedding_day'),
  ])

  const dotClass = {
    done: 'bg-success border-success',
    today: 'bg-primary border-primary shadow-[0_0_0_3px_rgba(196,99,58,0.18)]',
    upcoming: 'bg-card border-border',
  }

  return (
    <CardShell title='Milestones' icon='▷' action='Full timeline →' actionHref='/checklist'>
      <div className='flex flex-col'>
        {visibleMilestones.map((milestone, i) => {
          const status = getMilestoneStatus(milestone, pendingMilestones[0]?.id)
          const subtitle =
            milestone.key === 'wedding_day' && weddingDateLabel
              ? weddingDateLabel
              : milestone.targetDate
                ? new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC',
                  }).format(new Date(milestone.targetDate))
                : status === 'done'
                  ? 'Completed'
                  : status === 'today'
                    ? 'Current milestone'
                    : 'Upcoming'

          return (
            <div key={milestone.id} className='relative flex gap-3 pb-3 last:pb-0'>
              {i < visibleMilestones.length - 1 && (
                <div className='absolute top-4 bottom-0 left-[5px] w-px bg-border' />
              )}
              <span
                className={`relative z-10 mt-1 h-3 w-3 flex-shrink-0 rounded-full border-2 ${dotClass[status]}`}
              />
              <div>
                <p className='font-serif text-[0.88rem] text-foreground leading-tight'>
                  {milestone.title}
                  {milestone.key === 'wedding_day' ? ' ✦' : ''}
                  {hasMilestoneOverride(milestone) ? ' ⚠' : ''}
                </p>
                <p
                  className={`mt-0.5 font-mono text-[0.58rem] tracking-wider ${
                    status === 'today' ? 'text-foreground/80' : 'text-foreground/60'
                  }`}
                >
                  {subtitle}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </CardShell>
  )
}

export default function PlanningOverview({ dashboardData }: PlanningOverviewProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const utils = api.useUtils()
  const events = useMemo(
    () => (dashboardData?.events ?? []) as unknown as EventWithStats[],
    [dashboardData?.events]
  )
  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      setIsCreateDialogOpen(false)
      void Promise.all([
        utils.task.getPriorityQueue.invalidate(),
        utils.dashboard.getForActiveWorkspace.invalidate(),
      ])
    },
    onError: () => {
      toast.error('Failed to add task')
    },
  })

  useEffect(() => {
    const handleOpenCreateTask = () => {
      if (events.length === 0) {
        toast.error('Add an event before creating a task')
        return
      }

      setIsCreateDialogOpen(true)
    }

    window.addEventListener(DASHBOARD_ADD_TASK_EVENT, handleOpenCreateTask)
    return () => window.removeEventListener(DASHBOARD_ADD_TASK_EVENT, handleOpenCreateTask)
  }, [events])

  return (
    <>
      <div className='flex flex-col gap-5'>
        {/* Countdown hero */}
        <CountdownHero dashboardData={dashboardData} />

        {/* Mini stats */}
        <MiniStats dashboardData={dashboardData} />

        {/* Row: RSVP + Tasks */}
        <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
          <RsvpCard dashboardData={dashboardData} />
          <TasksCard dashboardData={dashboardData} />
        </div>

        {/* Row: Budget + Vendors + Milestones */}
        <div className='grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'>
          <BudgetCard />
          <VendorsCard />
          <MilestonesCard dashboardData={dashboardData} />
        </div>
      </div>

      <TaskDialog
        mode='create'
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        events={events}
        isSubmitting={createTask.isPending}
        onSubmit={(data) => createTask.mutate(data)}
      />
    </>
  )
}

const dedupeMilestones = <T extends { id: string }>(milestones: T[]): T[] => {
  const seen = new Set<string>()
  return milestones.filter((milestone) => {
    if (seen.has(milestone.id)) {
      return false
    }

    seen.add(milestone.id)
    return true
  })
}

const getMilestoneStatus = (
  milestone: DashboardOverview['milestones'][number],
  currentPendingMilestoneId?: string
): 'done' | 'today' | 'upcoming' => {
  if (milestone.effectiveStatus === 'done') {
    return 'done'
  }

  if (milestone.id === currentPendingMilestoneId) {
    return 'today'
  }

  return 'upcoming'
}

const hasMilestoneOverride = (milestone: DashboardOverview['milestones'][number]): boolean =>
  milestone.userOverrideStatus !== null && milestone.effectiveStatus !== milestone.derivedStatus
