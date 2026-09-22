'use client'

import { memo } from 'react'

import type { TaskItem } from '~/components/dashboard/planning-overview/use-tasks-card-state'

type TaskListItemProps = Readonly<{
  task: TaskItem
  onToggle: (taskId: string) => void
}>

const tagClass: Record<string, string> = {
  Vendor: 'bg-success/12 text-success',
  Admin: 'bg-accent/12 text-accent-foreground',
  Urgent: 'bg-primary/10 text-foreground',
  Overdue: 'bg-destructive/10 text-destructive',
}

function TaskListItemBase({ task, onToggle }: TaskListItemProps) {
  return (
    <button
      type='button'
      aria-pressed={task.done}
      onClick={() => onToggle(task.id)}
      className='flex min-h-[44px] w-full items-center gap-2.5 rounded px-2 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
    >
      <span
        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border text-[0.6rem] transition-all ${
          task.done
            ? 'border-success bg-success text-white'
            : 'border-border hover:border-success/70'
        }`}
      >
        {task.done && '✓'}
      </span>
      <span
        className={`flex-1 font-serif text-[0.9rem] leading-tight ${
          task.done ? 'text-foreground/50 line-through decoration-foreground/25' : 'text-foreground'
        }`}
      >
        {task.text}
      </span>
      <span
        className={`flex-shrink-0 rounded-full px-2 py-0.5 font-mono text-[0.52rem] uppercase tracking-wider ${tagClass[task.tag] ?? 'bg-muted text-foreground/60'}`}
      >
        {task.tag}
      </span>
      <span
        className={`flex-shrink-0 font-mono text-[0.56rem] tracking-wider ${task.urgent ? 'text-foreground/80' : 'text-foreground/50'}`}
      >
        {task.due}
      </span>
    </button>
  )
}

export const TaskListItem = memo(TaskListItemBase)
