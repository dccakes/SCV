'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { DashboardData, EventWithResponses } from '~/app/utils/shared-types'
import { formatCurrency } from '~/components/budget/format'
import { TaskDialog } from '~/components/checklist/task-dialog'
import { TaskListItem } from '~/components/dashboard/planning-overview/task-list-item'
import {
  type TaskItem,
  useTasksCardState,
} from '~/components/dashboard/planning-overview/use-tasks-card-state'
import { DASHBOARD_ADD_TASK_EVENT } from '~/components/dashboard/task-dialog-events'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import type { EventWithStats } from '~/server/domains/event'
import { api } from '~/trpc/react'

type DashboardOverview = NonNullable<DashboardData>

const EMPTY_PRIORITY_TASKS: DashboardOverview['taskPriorityQueue']['tasks'] = []

interface PlanningOverviewProps {
  dashboardData: DashboardData | null
}

const linkClass =
  'text-primary text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

const outlineLinkClass =
  'inline-flex min-h-[44px] items-center rounded-[10px] border border-border px-4 font-semibold text-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

function Panel({
  id,
  title,
  action,
  actionHref,
  aside,
  children,
}: {
  id: string
  title: string
  action?: string
  actionHref?: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  const headingId = `dashboard-${id}`

  return (
    <section
      aria-labelledby={headingId}
      className='rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6'
    >
      <div className='mb-3 flex items-baseline justify-between gap-3'>
        <h2 id={headingId} className='font-semibold text-[1.02rem] text-foreground'>
          {title}
        </h2>
        <div className='flex items-baseline gap-4'>
          {aside}
          {action && actionHref && (
            <Link href={actionHref} className={linkClass}>
              {action}
            </Link>
          )}
        </div>
      </div>
      {children}
    </section>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className='text-muted-foreground text-sm leading-relaxed'>{children}</p>
}

function getCountdownHeading(days: number): { lead: string; tail: string } {
  if (days === 0) return { lead: "It's your", tail: 'wedding day' }
  if (days === 1) return { lead: '1 day', tail: 'to go' }
  return { lead: `${days} days`, tail: 'to go' }
}

function TodayHero({ dashboardData }: { dashboardData: DashboardData | null }) {
  const weddingData = dashboardData?.weddingData
  const bride = weddingData?.brideFirstName ?? ''
  const groom = weddingData?.groomFirstName ?? ''
  const coupleName = bride && groom ? `${bride} & ${groom}` : bride || groom || 'Your Wedding'
  const hasDate = weddingData?.daysRemaining != null && weddingData.daysRemaining >= 0
  const dateLabel = weddingData?.date?.standardFormat ?? ''
  const location = weddingData?.location ?? ''
  const isPastDate = !hasDate && dateLabel !== '' && (weddingData?.daysRemaining ?? 0) < 0

  const milestones = dashboardData?.milestones ?? []
  const completedMilestones = milestones.filter((milestone) => milestone.effectiveStatus === 'done')
  const planningPct =
    milestones.length > 0 ? Math.round((completedMilestones.length / milestones.length) * 100) : 0
  const countdown = hasDate ? getCountdownHeading(weddingData.daysRemaining) : null

  return (
    <div className='flex flex-col gap-3'>
      {countdown && <p className='text-muted-foreground text-sm'>{coupleName}</p>}
      <h2 className='font-display text-5xl text-foreground leading-[1.02] tracking-tight md:text-7xl'>
        {countdown ? (
          <>
            {countdown.lead} <span className='text-primary italic'>{countdown.tail}</span>
          </>
        ) : (
          coupleName
        )}
      </h2>
      {(dateLabel || location) && (
        <p className='text-base text-muted-foreground'>
          {[dateLabel, location].filter(Boolean).join(' · ')}
        </p>
      )}
      {!hasDate && (
        <p className='text-muted-foreground text-sm'>
          <span>{isPastDate ? 'This date has passed' : 'No date set'}</span>
          {' · '}
          <Link href='/settings' className='text-primary underline underline-offset-2'>
            {isPastDate ? 'Update it in Settings' : 'Add it in Settings'}
          </Link>
        </p>
      )}
      <div className='mt-1 flex items-center gap-3'>
        <div
          className='h-1.5 w-40 overflow-hidden rounded-full bg-secondary'
          role='img'
          aria-label={`${planningPct}% of planning complete`}
        >
          <div className='h-full rounded-full bg-primary' style={{ width: `${planningPct}%` }} />
        </div>
        <p className='text-muted-foreground text-sm'>{planningPct}% of planning complete</p>
      </div>
    </div>
  )
}

function UpNextCard({
  task,
  onComplete,
}: {
  task: TaskItem | undefined
  onComplete: (taskId: string) => void
}) {
  return (
    <section
      aria-labelledby='dashboard-up-next'
      className='flex flex-wrap items-center gap-6 rounded-2xl border border-border/70 bg-card p-6 shadow-sm md:p-7'
    >
      <div className='flex min-w-0 flex-[1_1_280px] flex-col gap-2'>
        <h2
          id='dashboard-up-next'
          className='font-semibold text-primary text-xs uppercase tracking-[0.1em]'
        >
          Up next
        </h2>
        {task ? (
          <>
            <p className='font-semibold text-2xl text-foreground tracking-tight'>{task.text}</p>
            <p className='text-muted-foreground text-sm'>
              {task.tag} · {task.due}
            </p>
          </>
        ) : (
          <>
            <p className='font-semibold text-2xl text-foreground tracking-tight'>
              You're all caught up
            </p>
            <EmptyNote>
              No active tasks yet. Add your first task to start tracking your planning progress.
            </EmptyNote>
          </>
        )}
      </div>
      <div className='flex flex-wrap gap-2.5'>
        {task && (
          <Button type='button' size='lg' className='px-5' onClick={() => onComplete(task.id)}>
            Mark done
          </Button>
        )}
        <Link href='/checklist' className={outlineLinkClass}>
          {task ? 'Open checklist' : 'Go to checklist →'}
        </Link>
      </div>
    </section>
  )
}

function ComingUpCard({
  tasks,
  totalActive,
  dueThisMonth,
  onToggle,
}: {
  tasks: TaskItem[]
  totalActive: number
  dueThisMonth: number
  onToggle: (taskId: string) => void
}) {
  return (
    <Panel
      id='coming-up'
      title='Coming up'
      action='View all →'
      actionHref='/checklist'
      aside={<span className='text-muted-foreground text-sm'>{dueThisMonth} due this month</span>}
    >
      {tasks.length > 0 ? (
        <div className='-mx-2 flex flex-col'>
          {tasks.map((task) => (
            <TaskListItem key={task.id} task={task} onToggle={onToggle} />
          ))}
        </div>
      ) : (
        <EmptyNote>Nothing else is due right now.</EmptyNote>
      )}
      <p className='mt-3 text-muted-foreground text-xs'>
        {tasks.length + 1} of {totalActive} active tasks shown
      </p>
    </Panel>
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
      <Panel id='rsvps' title='RSVPs'>
        <div className='flex flex-col gap-3'>
          <p className='font-medium text-foreground text-sm'>No RSVPs collected yet</p>
          <EmptyNote>
            Enable RSVP collection on one of your events to start tracking responses
          </EmptyNote>
          <Link href='/events' className={`${outlineLinkClass} self-start`}>
            Set up RSVPs →
          </Link>
        </div>
      </Panel>
    )
  }

  const confirmedPct = (attending / total) * 100
  const pendingPct = (pending / total) * 100
  const declinedPct = (declined / total) * 100

  return (
    <Panel id='rsvps' title='RSVPs'>
      <div className='flex flex-col gap-3'>
        <p className='font-display text-[2.75rem] text-foreground leading-none'>
          {attending}
          <span className='text-muted-foreground text-xl'> / {total}</span>
        </p>
        <div
          className='flex h-1.5 overflow-hidden rounded-full bg-secondary'
          role='img'
          aria-label={`RSVP breakdown: ${Math.round(confirmedPct)}% confirmed, ${Math.round(pendingPct)}% pending, ${Math.round(declinedPct)}% declined`}
        >
          <div className='bg-primary' style={{ width: `${confirmedPct}%` }} />
          <div className='bg-gold/60' style={{ width: `${pendingPct}%` }} />
          <div className='bg-foreground/25' style={{ width: `${declinedPct}%` }} />
        </div>
        <p className='text-muted-foreground text-sm'>
          {pending > 0 ? `${pending} still to reply` : 'Everyone has replied'}
          {declined > 0 ? ` · ${declined} declined` : ''}
        </p>
        <Link href='/guest-list' className={`${outlineLinkClass} self-start`}>
          Manage RSVPs →
        </Link>
      </div>
    </Panel>
  )
}

function BudgetCard() {
  const { data: overview, isLoading } = api.budget.getOverview.useQuery()

  if (isLoading) {
    return (
      <Panel id='budget' title='Budget' action='Manage →' actionHref='/budget'>
        <div className='flex flex-col gap-3'>
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-1.5 w-full' />
          <Skeleton className='h-3 w-40' />
        </div>
      </Panel>
    )
  }

  const hasTarget = (overview?.targetTotal ?? 0) > 0
  const hasCategories = (overview?.categories.length ?? 0) > 0
  const hasBudget = hasTarget || hasCategories

  if (!hasBudget) {
    return (
      <Panel id='budget' title='Budget' action='Manage →' actionHref='/budget'>
        <div className='flex flex-col gap-3'>
          <p className='font-medium text-foreground text-sm'>No budget set up yet</p>
          <EmptyNote>Track your wedding spending against a target budget</EmptyNote>
          <Link href='/budget' className={`${outlineLinkClass} self-start`}>
            Set up your budget →
          </Link>
        </div>
      </Panel>
    )
  }

  const currency = overview!.currency
  const { netSpend, remaining, actualSpend } = overview!.summary
  const target = overview!.targetTotal
  const categoryCount = overview!.categories.length
  const pct = target > 0 ? Math.min(100, Math.round((netSpend / target) * 100)) : 0
  const overBudget = target > 0 && netSpend > target

  return (
    <Panel id='budget' title='Budget' action='Manage →' actionHref='/budget'>
      <div className='flex flex-col gap-3'>
        <p className='font-display text-[2.75rem] text-foreground leading-none'>
          {formatCurrency(netSpend, currency)}
          <span className='text-muted-foreground text-xl'>
            {target > 0 ? ` / ${formatCurrency(target, currency)}` : ' net spend'}
          </span>
        </p>
        {target > 0 && (
          <div
            className='h-1.5 overflow-hidden rounded-full bg-secondary'
            role='img'
            aria-label={`${pct}% of budget used`}
          >
            <div
              className={`h-full rounded-full transition-all ${overBudget ? 'bg-destructive' : 'bg-gold'}`}
              style={{ width: `${pct > 0 ? Math.max(2, pct) : 0}%` }}
            />
          </div>
        )}
        <p className={`text-sm ${overBudget ? 'text-destructive' : 'text-muted-foreground'}`}>
          {formatCurrency(actualSpend, currency)} spent ·{' '}
          {target > 0
            ? `${formatCurrency(remaining, currency)} remaining`
            : `${categoryCount} section${categoryCount !== 1 ? 's' : ''}`}
        </p>
      </div>
    </Panel>
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
      <Panel id='vendors' title='Vendors' action='Manage →' actionHref='/vendors'>
        <div className='flex flex-col gap-3'>
          <p className='font-medium text-foreground text-sm'>No vendors added yet</p>
          <EmptyNote>Track quotes, contacts, and contracts in one place</EmptyNote>
          <Link href='/vendors' className={`${outlineLinkClass} self-start`}>
            Add your first vendor →
          </Link>
        </div>
      </Panel>
    )
  }

  return (
    <Panel id='vendors' title='Vendors' action='Manage →' actionHref='/vendors'>
      <div className='flex flex-col gap-3'>
        <p className='flex items-baseline gap-2'>
          <span className='font-display text-[2.75rem] text-foreground leading-none'>
            {vendorCount}
          </span>
          <span className='text-muted-foreground text-sm'>
            vendor{vendorCount !== 1 ? 's' : ''} tracked
          </span>
        </p>
        <div className='flex flex-col'>
          {[
            { val: selected, label: 'Selected' },
            { val: inProgress, label: 'In Progress' },
            { val: inReview, label: 'In Review' },
          ].map((s) => (
            <div
              key={s.label}
              className='flex items-center justify-between border-border/70 border-t py-2 text-sm'
            >
              <span className='text-muted-foreground'>{s.label}</span>
              <span className='font-semibold text-foreground tabular-nums'>{s.val}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
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
    done: 'bg-primary border-primary',
    today: 'bg-gold border-gold ring-4 ring-gold/20',
    upcoming: 'bg-card border-border',
  }

  return (
    <Panel id='milestones' title='Milestones' action='Full timeline →' actionHref='/checklist'>
      {visibleMilestones.length === 0 && (
        <EmptyNote>Milestones appear here as you plan and tick off your checklist.</EmptyNote>
      )}
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
            <div key={milestone.id} className='relative flex gap-3 pb-4 last:pb-0'>
              {i < visibleMilestones.length - 1 && (
                <div className='absolute top-4 bottom-0 left-[5px] w-px bg-border' />
              )}
              <span
                className={`relative z-10 mt-1.5 h-3 w-3 flex-shrink-0 rounded-full border-2 ${dotClass[status]}`}
              />
              <div>
                <p className='font-medium text-foreground text-sm leading-tight'>
                  {milestone.title}
                  {milestone.key === 'wedding_day' ? ' ✦' : ''}
                  {hasMilestoneOverride(milestone) ? ' ⚠' : ''}
                </p>
                <p
                  className={`mt-0.5 text-xs ${
                    status === 'today' ? 'text-foreground/80' : 'text-muted-foreground'
                  }`}
                >
                  {subtitle}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

function PlanningTasks({ dashboardData }: { dashboardData: DashboardData | null }) {
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

  const upNext = tasks.find((task) => !task.done)
  const rest = tasks.filter((task) => task.id !== upNext?.id)

  return (
    <>
      <UpNextCard task={upNext} onComplete={handleToggle} />
      {tasks.length > 0 && (
        <ComingUpCard
          tasks={rest}
          totalActive={priorityQueue?.totalActive ?? 0}
          dueThisMonth={dashboardData?.tasksDueThisMonth ?? 0}
          onToggle={handleToggle}
        />
      )}
    </>
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
      <div className='mx-auto flex max-w-[1080px] flex-col gap-8 pb-6'>
        <TodayHero dashboardData={dashboardData} />

        <div className='flex flex-wrap items-start gap-6'>
          <div className='flex min-w-0 flex-[2_1_520px] flex-col gap-6'>
            <PlanningTasks dashboardData={dashboardData} />
            <MilestonesCard dashboardData={dashboardData} />
          </div>
          <div className='flex min-w-0 flex-[1_1_280px] flex-col gap-4'>
            <RsvpCard dashboardData={dashboardData} />
            <BudgetCard />
            <VendorsCard />
          </div>
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
