'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  bucketTasks,
  filterTasks,
  getChecklistFiltersFromSearchParams,
  hasMilestoneOverrideDivergence,
  type TaskBucketKey,
} from '~/components/checklist/checklist-view-model'
import { MilestoneDetail } from '~/components/checklist/milestone-detail'
import { TaskDialog } from '~/components/checklist/task-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { TASK_CATEGORIES, TASK_CATEGORY_LABELS } from '~/lib/constants/task-categories'
import type { EventWithStats } from '~/server/domains/event'
import type { MilestoneWithEffectiveStatus } from '~/server/domains/milestone'
import type { Task } from '~/server/domains/task'
import { api } from '~/trpc/react'

const STATUS_FILTER_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'All', value: 'all' },
] as const

type ChecklistPageClientProps = Readonly<{
  initialTasks: Task[]
  initialMilestones: MilestoneWithEffectiveStatus[]
  initialEvents: EventWithStats[]
}>

export function ChecklistPageClient({
  initialTasks,
  initialMilestones,
  initialEvents,
}: ChecklistPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const filters = getChecklistFiltersFromSearchParams(searchParams)
  const [collapsedBuckets, setCollapsedBuckets] = useState<Set<TaskBucketKey>>(
    () => new Set(['done'])
  )
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const utils = api.useUtils()

  const { data: tasks = initialTasks } = api.task.list.useQuery(
    {},
    {
      initialData: initialTasks,
      staleTime: 30_000,
    }
  )
  const { data: milestones = initialMilestones } = api.milestone.getAll.useQuery(
    {},
    {
      initialData: initialMilestones,
      staleTime: 30_000,
    }
  )
  const { data: events = initialEvents } = api.event.getAllByUserIdWithStats.useQuery(undefined, {
    initialData: initialEvents,
    staleTime: 30_000,
  })

  const filteredTasks = useMemo(() => filterTasks(tasks, filters), [filters, tasks])
  const buckets = useMemo(() => bucketTasks(filteredTasks), [filteredTasks])
  const hasDefaultFilters =
    filters.category === 'all' && filters.eventId === 'all' && filters.status === 'all'
  const hasActiveTasks = tasks.some((task) => !task.completed)

  const completeTask = api.task.complete.useMutation({
    onSuccess: () => {
      void Promise.all([
        utils.task.list.invalidate(),
        utils.task.getPriorityQueue.invalidate(),
        utils.dashboard.getForActiveWorkspace.invalidate(),
      ])
    },
    onError: () => toast.error('Failed to update task'),
  })
  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      setIsCreateDialogOpen(false)
      void Promise.all([
        utils.task.list.invalidate(),
        utils.task.getPriorityQueue.invalidate(),
        utils.dashboard.getForActiveWorkspace.invalidate(),
      ])
    },
    onError: () => toast.error('Failed to create task'),
  })
  const updateTask = api.task.update.useMutation({
    onSuccess: () => {
      setEditingTask(null)
      void Promise.all([
        utils.task.list.invalidate(),
        utils.task.getPriorityQueue.invalidate(),
        utils.dashboard.getForActiveWorkspace.invalidate(),
      ])
    },
    onError: () => toast.error('Failed to update task'),
  })
  const deleteTask = api.task.delete.useMutation({
    onSuccess: () => {
      setDeletingTask(null)
      setEditingTask(null)
      void Promise.all([
        utils.task.list.invalidate(),
        utils.task.getPriorityQueue.invalidate(),
        utils.dashboard.getForActiveWorkspace.invalidate(),
      ])
    },
    onError: () => toast.error('Failed to delete task'),
  })

  const attestMilestone = api.milestone.attest.useMutation({
    onSuccess: () => {
      void Promise.all([
        utils.milestone.getAll.invalidate(),
        utils.dashboard.getForActiveWorkspace.invalidate(),
      ])
    },
    onError: () => toast.error('Failed to update milestone'),
  })
  const dismissMilestone = api.milestone.dismiss.useMutation({
    onSuccess: () => {
      void Promise.all([
        utils.milestone.getAll.invalidate(),
        utils.dashboard.getForActiveWorkspace.invalidate(),
      ])
    },
    onError: () => toast.error('Failed to update milestone'),
  })
  const clearMilestoneOverride = api.milestone.clearOverride.useMutation({
    onSuccess: () => {
      void Promise.all([
        utils.milestone.getAll.invalidate(),
        utils.dashboard.getForActiveWorkspace.invalidate(),
      ])
    },
    onError: () => toast.error('Failed to update milestone'),
  })

  const updateFilter = (key: 'category' | 'eventId' | 'status', value: string) => {
    const nextSearchParams = new URLSearchParams(searchParams.toString())

    if (value === 'all') {
      nextSearchParams.delete(key)
    } else {
      nextSearchParams.set(key, value)
    }

    router.replace(
      nextSearchParams.toString().length > 0
        ? `${pathname}?${nextSearchParams.toString()}`
        : pathname
    )
  }

  const toggleBucket = (bucketKey: TaskBucketKey) => {
    setCollapsedBuckets((current) => {
      const next = new Set(current)

      if (next.has(bucketKey)) {
        next.delete(bucketKey)
      } else {
        next.add(bucketKey)
      }

      return next
    })
  }

  return (
    <div className='space-y-6'>
      <Card className='border-border/60 bg-card/95 shadow-sm'>
        <CardHeader className='gap-2'>
          <p className='font-mono text-[0.62rem] text-muted-foreground uppercase tracking-[0.12em]'>
            Milestones
          </p>
          <CardTitle className='font-display text-3xl italic'>Your planning timeline</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-3 overflow-x-auto pb-2'>
            {milestones.map((milestone) => (
              <MilestoneDetail
                key={milestone.id}
                milestone={milestone}
                onAttest={(milestoneId) => attestMilestone.mutate({ milestoneId })}
                onDismiss={(milestoneId) => dismissMilestone.mutate({ milestoneId })}
                onClearOverride={(milestoneId) => clearMilestoneOverride.mutate({ milestoneId })}
                trigger={
                  <button
                    type='button'
                    className='flex min-w-[190px] flex-col rounded-lg border border-border/60 bg-background/70 p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40'
                  >
                    <span className='font-mono text-[0.58rem] text-muted-foreground uppercase tracking-[0.12em]'>
                      {milestone.category}
                    </span>
                    <span className='mt-2 font-serif text-foreground text-sm'>
                      {milestone.title}
                    </span>
                    <span className='mt-3 flex items-center gap-2'>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          milestone.effectiveStatus === 'done'
                            ? 'bg-success'
                            : 'border border-border'
                        }`}
                      />
                      <span className='font-mono text-[0.56rem] text-muted-foreground uppercase tracking-[0.12em]'>
                        {milestone.effectiveStatus}
                      </span>
                      {hasMilestoneOverrideDivergence(milestone) ? (
                        <Badge variant='secondary' className='ml-auto font-mono text-[0.5rem]'>
                          ⚠ override
                        </Badge>
                      ) : null}
                    </span>
                  </button>
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className='border-border/60 bg-card/95 shadow-sm'>
        <CardHeader className='gap-2'>
          <div className='flex items-center justify-between gap-3'>
            <p className='font-mono text-[0.62rem] text-muted-foreground uppercase tracking-[0.12em]'>
              Checklist
            </p>
            <Button type='button' size='sm' onClick={() => setIsCreateDialogOpen(true)}>
              Add task
            </Button>
          </div>
          <CardTitle className='font-display text-3xl italic'>Tasks by time horizon</CardTitle>
        </CardHeader>
        <CardContent className='space-y-5'>
          <div className='space-y-3'>
            <FilterChipGroup label='Category'>
              <FilterChip
                active={filters.category === 'all'}
                onClick={() => updateFilter('category', 'all')}
              >
                ALL
              </FilterChip>
              {TASK_CATEGORIES.map((category) => (
                <FilterChip
                  key={category}
                  active={filters.category === category}
                  onClick={() => updateFilter('category', category)}
                >
                  {category}
                </FilterChip>
              ))}
            </FilterChipGroup>

            <FilterChipGroup label='Event'>
              <FilterChip
                active={filters.eventId === 'all'}
                onClick={() => updateFilter('eventId', 'all')}
              >
                ALL EVENTS
              </FilterChip>
              {events.map((event) => (
                <FilterChip
                  key={event.id}
                  active={filters.eventId === event.id}
                  onClick={() => updateFilter('eventId', event.id)}
                >
                  {event.name}
                </FilterChip>
              ))}
            </FilterChipGroup>

            <FilterChipGroup label='Status'>
              {STATUS_FILTER_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  active={filters.status === option.value}
                  onClick={() => updateFilter('status', option.value)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </FilterChipGroup>
          </div>

          <div className='space-y-4'>
            {events.length === 0 ? (
              <ChecklistEmptyState
                title='Add your first event to unlock the checklist'
                description='Every task belongs to an event, so start by creating the ceremony or main celebration.'
                action={{
                  href: '/events',
                  label: 'Go to events',
                }}
              />
            ) : tasks.length === 0 && hasDefaultFilters ? (
              <ChecklistEmptyState
                title='No tasks added yet'
                description='Start with one custom task, or let the default checklist grow from your first planning steps.'
                action={{
                  label: 'Add task',
                  onClick: () => setIsCreateDialogOpen(true),
                }}
              />
            ) : tasks.length > 0 && !hasActiveTasks && filters.status !== 'completed' ? (
              <ChecklistEmptyState
                title='Everything is checked off'
                description='You are caught up for now. Switch to Completed to review what is already done, or add a new task.'
                action={{
                  label: 'Add task',
                  onClick: () => setIsCreateDialogOpen(true),
                }}
              />
            ) : buckets.every((bucket) => bucket.tasks.length === 0) ? (
              <ChecklistEmptyState
                title='Nothing in this view yet'
                description='Adjust the filters or add a task to start shaping the checklist.'
              />
            ) : (
              buckets
                .filter((bucket) => bucket.tasks.length > 0)
                .map((bucket) => (
                  <section key={bucket.key} className='space-y-2'>
                    <button
                      type='button'
                      aria-label={`${bucket.title} bucket`}
                      aria-expanded={!collapsedBuckets.has(bucket.key)}
                      aria-controls={`bucket-content-${bucket.key}`}
                      className='flex w-full items-center gap-3 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-muted/40'
                      onClick={() => toggleBucket(bucket.key)}
                    >
                      <ChevronDown
                        aria-hidden='true'
                        className={`h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform ${
                          collapsedBuckets.has(bucket.key) ? '-rotate-90' : 'rotate-0'
                        }`}
                      />
                      <h2 className='font-mono text-[0.62rem] text-muted-foreground uppercase tracking-[0.12em]'>
                        {bucket.title}
                      </h2>
                      <span className='h-px flex-1 bg-border/70' />
                      <span className='font-mono text-[0.56rem] text-muted-foreground uppercase tracking-[0.12em]'>
                        {bucket.tasks.length}
                      </span>
                    </button>

                    {collapsedBuckets.has(bucket.key) ? null : (
                      <div id={`bucket-content-${bucket.key}`} className='space-y-1'>
                        {bucket.tasks.map((task) => (
                          <div
                            key={task.id}
                            className='flex min-h-[44px] items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40'
                          >
                            <Checkbox
                              aria-label={`Toggle task ${task.title}`}
                              checked={task.completed}
                              onCheckedChange={(checked) =>
                                completeTask.mutate({
                                  taskId: task.id,
                                  completed: checked === true,
                                })
                              }
                            />
                            <span
                              className={`flex-1 font-serif text-sm ${
                                task.completed
                                  ? 'text-muted-foreground line-through'
                                  : 'text-foreground'
                              }`}
                            >
                              {task.title}
                            </span>
                            <span className='font-mono text-[0.56rem] text-muted-foreground uppercase tracking-[0.12em]'>
                              {TASK_CATEGORY_LABELS[task.category]}
                            </span>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              aria-label={`Edit task ${task.title}`}
                              onClick={() => setEditingTask(task)}
                            >
                              Edit
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      <TaskDialog
        mode='create'
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        events={events}
        isSubmitting={createTask.isPending}
        onSubmit={(data) => createTask.mutate(data)}
      />

      {editingTask ? (
        <TaskDialog
          mode='edit'
          open
          onOpenChange={(open) => !open && setEditingTask(null)}
          events={events}
          task={editingTask}
          isSubmitting={updateTask.isPending}
          onDelete={() => setDeletingTask(editingTask)}
          onSubmit={(data) =>
            updateTask.mutate({
              taskId: editingTask.id,
              ...data,
            })
          }
        />
      ) : null}

      <AlertDialog
        open={deletingTask !== null}
        onOpenChange={(open) => !open && setDeletingTask(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &quot;{deletingTask?.title ?? 'this task'}&quot; from the checklist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deletingTask) {
                  return
                }
                deleteTask.mutate({ taskId: deletingTask.id })
              }}
            >
              Confirm delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FilterChipGroup({
  children,
  label,
}: Readonly<{
  children: React.ReactNode
  label: string
}>) {
  return (
    <div className='space-y-2'>
      <p className='font-mono text-[0.58rem] text-muted-foreground uppercase tracking-[0.12em]'>
        {label}
      </p>
      <div className='flex flex-wrap gap-2'>{children}</div>
    </div>
  )
}

function FilterChip({
  active,
  children,
  onClick,
}: Readonly<{
  active: boolean
  children: React.ReactNode
  onClick: () => void
}>) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 font-mono text-[0.58rem] uppercase tracking-[0.12em] transition-colors ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/70 bg-background/70 text-foreground hover:border-primary/40 hover:bg-muted/40'
      }`}
    >
      {children}
    </button>
  )
}

function ChecklistEmptyState({
  title,
  description,
  action,
}: Readonly<{
  title: string
  description: string
  action?: {
    href?: string
    label: string
    onClick?: () => void
  }
}>) {
  return (
    <div className='rounded-lg border border-border/70 border-dashed px-4 py-8 text-center'>
      <p className='font-display text-2xl italic'>{title}</p>
      <p className='mt-2 font-sans text-muted-foreground text-sm'>{description}</p>
      {action?.href ? (
        <Link
          href={action.href}
          className='mt-4 inline-flex min-h-[44px] items-center justify-center rounded-sm border border-border px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.12em] transition-colors hover:border-primary/40 hover:bg-muted/40'
        >
          {action.label}
        </Link>
      ) : action?.onClick ? (
        <Button type='button' className='mt-4' onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
