'use client'

import { memo } from 'react'

import type { TaskItem } from '~/components/dashboard/planning-overview/use-tasks-card-state'

type TaskListItemProps = Readonly<{
  task: TaskItem
  onToggle: (taskId: string) => void
}>

const tagClass: Record<string, string> = {
  Vendor: 'bg-accent text-accent-foreground',
  Admin: 'bg-secondary text-secondary-foreground',
  Urgent: 'bg-gold/15 text-foreground',
  Overdue: 'bg-destructive/10 text-destructive',
}

function TaskListItemBase({ task, onToggle }: TaskListItemProps) {
  return (
    <button
      type='button'
      onClick={() => onToggle(task.id)}
      className='flex min-h-[52px] w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
    >
      <span
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] text-[0.65rem] transition-all ${
          task.done
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-foreground/30 hover:border-primary'
        }`}
      >
        {task.done && '✓'}
      </span>
      <span
        className={`flex-1 text-[0.95rem] leading-tight ${
          task.done ? 'text-foreground/50 line-through decoration-foreground/25' : 'text-foreground'
        }`}
      >
        {task.text}
      </span>
      <span
        className={`flex-shrink-0 rounded-md px-2 py-0.5 text-xs ${tagClass[task.tag] ?? 'bg-secondary text-secondary-foreground'}`}
      >
        {task.tag}
      </span>
      <span
        className={`w-16 flex-shrink-0 text-right text-xs ${task.urgent ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {task.due}
      </span>
    </button>
  )
}

export const TaskListItem = memo(TaskListItemBase)
