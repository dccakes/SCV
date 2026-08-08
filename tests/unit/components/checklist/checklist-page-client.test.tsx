import { TaskCategory } from '@prisma/client'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ChecklistPageClient } from '~/app/(authenicated)/checklist/_components/checklist-page-client'
import type { EventWithStats } from '~/server/domains/event'
import type { MilestoneWithEffectiveStatus } from '~/server/domains/milestone'
import type { Task } from '~/server/domains/task'

const mockReplace = jest.fn()
const mockTaskCompleteMutate = jest.fn()
const mockTaskCreateMutate = jest.fn()
const mockTaskUpdateMutate = jest.fn()
const mockTaskDeleteMutate = jest.fn()
const mockMilestoneAttestMutate = jest.fn()
const mockMilestoneDismissMutate = jest.fn()
const mockMilestoneClearMutate = jest.fn()
const mockInvalidate = jest.fn()

jest.mock('~/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string
    onValueChange: (value: string) => void
    children: React.ReactNode
  }) => (
    <select
      aria-label='mock-select'
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: React.HTMLAttributes<HTMLDivElement>) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <option value=''>{placeholder}</option>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}))

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({
      task: {
        list: { invalidate: mockInvalidate },
        getPriorityQueue: { invalidate: mockInvalidate },
      },
      milestone: {
        getAll: { invalidate: mockInvalidate },
      },
      dashboard: {
        getForActiveWorkspace: { invalidate: mockInvalidate },
      },
    }),
    task: {
      list: {
        useQuery: (_input: unknown, options: { initialData: Task[] }) => ({
          data: options.initialData,
        }),
      },
      complete: {
        useMutation: (options?: { onSuccess?: () => void }) => ({
          mutate: (input: unknown) => {
            mockTaskCompleteMutate(input)
            options?.onSuccess?.()
          },
        }),
      },
      create: {
        useMutation: (options?: { onSuccess?: () => void }) => ({
          mutate: (input: unknown) => {
            mockTaskCreateMutate(input)
            options?.onSuccess?.()
          },
        }),
      },
      update: {
        useMutation: (options?: { onSuccess?: () => void }) => ({
          mutate: (input: unknown) => {
            mockTaskUpdateMutate(input)
            options?.onSuccess?.()
          },
        }),
      },
      delete: {
        useMutation: (options?: { onSuccess?: () => void }) => ({
          mutate: (input: unknown) => {
            mockTaskDeleteMutate(input)
            options?.onSuccess?.()
          },
        }),
      },
    },
    milestone: {
      getAll: {
        useQuery: (_input: unknown, options: { initialData: MilestoneWithEffectiveStatus[] }) => ({
          data: options.initialData,
        }),
      },
      attest: {
        useMutation: (options?: { onSuccess?: () => void }) => ({
          mutate: (input: unknown) => {
            mockMilestoneAttestMutate(input)
            options?.onSuccess?.()
          },
        }),
      },
      dismiss: {
        useMutation: (options?: { onSuccess?: () => void }) => ({
          mutate: (input: unknown) => {
            mockMilestoneDismissMutate(input)
            options?.onSuccess?.()
          },
        }),
      },
      clearOverride: {
        useMutation: (options?: { onSuccess?: () => void }) => ({
          mutate: (input: unknown) => {
            mockMilestoneClearMutate(input)
            options?.onSuccess?.()
          },
        }),
      },
    },
    event: {
      getAllByUserIdWithStats: {
        useQuery: (_input: unknown, options: { initialData: EventWithStats[] }) => ({
          data: options.initialData,
        }),
      },
    },
  },
}))

const initialTasks: Task[] = [
  {
    id: 'task-this-week',
    weddingId: 'wedding-1',
    eventId: 'event-1',
    vendorId: null,
    milestoneId: null,
    seedKey: null,
    title: 'Mail the invitations',
    category: TaskCategory.STATIONERY,
    monthsBeforeWedding: 9,
    dueDate: new Date('2026-04-30T00:00:00.000Z'),
    description: null,
    notes: null,
    isDefault: false,
    position: 0,
    completed: false,
    completedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  },
  {
    id: 'task-legal',
    weddingId: 'wedding-1',
    eventId: 'event-2',
    vendorId: null,
    milestoneId: null,
    seedKey: null,
    title: 'Collect the marriage license',
    category: TaskCategory.LEGAL,
    monthsBeforeWedding: 3,
    dueDate: null,
    description: null,
    notes: null,
    isDefault: false,
    position: 1,
    completed: false,
    completedAt: null,
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    updatedAt: new Date('2026-01-04T00:00:00.000Z'),
  },
  {
    id: 'task-done',
    weddingId: 'wedding-1',
    eventId: 'event-1',
    vendorId: null,
    milestoneId: null,
    seedKey: null,
    title: 'Pack the guest book pens',
    category: TaskCategory.OTHER,
    monthsBeforeWedding: 0,
    dueDate: null,
    description: null,
    notes: null,
    isDefault: false,
    position: 2,
    completed: true,
    completedAt: new Date('2026-04-22T00:00:00.000Z'),
    createdAt: new Date('2026-01-05T00:00:00.000Z'),
    updatedAt: new Date('2026-01-06T00:00:00.000Z'),
  },
]

const initialMilestones: MilestoneWithEffectiveStatus[] = [
  {
    id: 'milestone-1',
    weddingId: 'wedding-1',
    key: 'invitations_sent',
    title: 'Invitations sent',
    category: 'INVITATIONS',
    position: 7,
    targetDate: null,
    userOverrideStatus: 'attested',
    attestedAt: new Date('2026-02-01T00:00:00.000Z'),
    dismissedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    derivedStatus: 'pending',
    effectiveStatus: 'done',
  },
]

const initialEvents: EventWithStats[] = [
  {
    id: 'event-1',
    name: 'Ceremony',
    date: new Date('2026-10-10T00:00:00.000Z'),
    startTime: '14:00',
    endTime: '16:00',
    venue: 'Town Hall',
    attire: null,
    description: null,
    weddingId: 'wedding-1',
    collectRsvp: true,
    allowTagAlongs: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    guestResponses: { attending: 0, invited: 0, declined: 0, notInvited: 0 },
    estimatedAttendance: 0,
  },
  {
    id: 'event-2',
    name: 'Reception',
    date: new Date('2026-10-10T00:00:00.000Z'),
    startTime: '18:00',
    endTime: '23:00',
    venue: 'Glasshouse',
    attire: null,
    description: null,
    weddingId: 'wedding-1',
    collectRsvp: true,
    allowTagAlongs: false,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    guestResponses: { attending: 0, invited: 0, declined: 0, notInvited: 0 },
    estimatedAttendance: 0,
  },
]

describe('ChecklistPageClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
      push: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    })
    ;(usePathname as jest.Mock).mockReturnValue('/checklist')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())
  })

  it('renders milestone and task buckets from real data and keeps done collapsed by default', () => {
    render(
      <ChecklistPageClient
        initialTasks={initialTasks}
        initialMilestones={initialMilestones}
        initialEvents={initialEvents}
      />
    )

    expect(screen.getByText('Invitations sent')).toBeInTheDocument()
    expect(screen.getByText('This week')).toBeInTheDocument()
    expect(screen.getByText('3 months')).toBeInTheDocument()
    expect(screen.getByText('Mail the invitations')).toBeInTheDocument()
    expect(screen.getByText('Collect the marriage license')).toBeInTheDocument()
    expect(screen.getByText('⚠ override')).toBeInTheDocument()
    expect(screen.queryByText('Pack the guest book pens')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Done bucket' }))
    expect(screen.getByText('Pack the guest book pens')).toBeInTheDocument()
  })

  it('syncs filter changes into the URL', () => {
    render(
      <ChecklistPageClient
        initialTasks={initialTasks}
        initialMilestones={initialMilestones}
        initialEvents={initialEvents}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'LEGAL' }))

    expect(mockReplace).toHaveBeenCalledWith('/checklist?category=LEGAL')
  })

  it('toggles task completion through the mutation', () => {
    render(
      <ChecklistPageClient
        initialTasks={initialTasks}
        initialMilestones={initialMilestones}
        initialEvents={initialEvents}
      />
    )

    fireEvent.click(screen.getByRole('checkbox', { name: /toggle task mail the invitations/i }))

    expect(mockTaskCompleteMutate).toHaveBeenCalledWith({
      taskId: 'task-this-week',
      completed: true,
    })
  })

  it('opens the milestone detail and attests the milestone', () => {
    render(
      <ChecklistPageClient
        initialTasks={initialTasks}
        initialMilestones={initialMilestones}
        initialEvents={initialEvents}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /invitations sent/i }))
    fireEvent.click(screen.getByLabelText('Mark as done'))

    expect(mockMilestoneAttestMutate).toHaveBeenCalledWith({
      milestoneId: 'milestone-1',
    })
  })

  it('creates a task from the add dialog', async () => {
    render(
      <ChecklistPageClient
        initialTasks={initialTasks}
        initialMilestones={initialMilestones}
        initialEvents={initialEvents}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add task' }))
    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Book transport for the wedding party' },
    })
    fireEvent.change(screen.getAllByLabelText('mock-select')[0], {
      target: { value: TaskCategory.OTHER },
    })
    fireEvent.change(screen.getByLabelText('Months before wedding'), {
      target: { value: '1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save task' }))

    await waitFor(() =>
      expect(mockTaskCreateMutate).toHaveBeenCalledWith({
        title: 'Book transport for the wedding party',
        category: TaskCategory.OTHER,
        eventId: 'event-1',
        monthsBeforeWedding: 1,
        dueDate: null,
        description: null,
        notes: null,
      })
    )
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Add task' })).not.toBeInTheDocument()
    )
  })

  it('renders a no-events empty state when tasks cannot be attached yet', () => {
    render(
      <ChecklistPageClient
        initialTasks={[]}
        initialMilestones={initialMilestones}
        initialEvents={[]}
      />
    )

    expect(screen.getByText('Add your first event to unlock the checklist')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to events' })).toHaveAttribute('href', '/events')
  })

  it('renders a no-tasks empty state for a fresh checklist', () => {
    render(
      <ChecklistPageClient
        initialTasks={[]}
        initialMilestones={initialMilestones}
        initialEvents={initialEvents}
      />
    )

    expect(screen.getByText('No tasks added yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Add task' }).length).toBeGreaterThan(0)
  })

  it('renders an all-done empty state when only completed tasks remain', () => {
    render(
      <ChecklistPageClient
        initialTasks={initialTasks.slice(2, 3)}
        initialMilestones={initialMilestones}
        initialEvents={initialEvents}
      />
    )

    expect(screen.getByText('Everything is checked off')).toBeInTheDocument()
  })

  it('updates and deletes a task from the edit flow', async () => {
    render(
      <ChecklistPageClient
        initialTasks={initialTasks}
        initialMilestones={initialMilestones}
        initialEvents={initialEvents}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit task Collect the marriage license' }))
    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Collect and scan the marriage license' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(mockTaskUpdateMutate).toHaveBeenCalledWith({
        taskId: 'task-legal',
        title: 'Collect and scan the marriage license',
        category: TaskCategory.LEGAL,
        eventId: 'event-2',
        monthsBeforeWedding: 3,
        dueDate: null,
        description: null,
        notes: null,
      })
    )
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Edit task' })).not.toBeInTheDocument()
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit task Collect the marriage license' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(mockTaskDeleteMutate).toHaveBeenCalledWith({
      taskId: 'task-legal',
    })
  })
})
