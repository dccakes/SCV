import { TaskCategory } from '@prisma/client'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { TaskDialog } from '~/components/checklist/task-dialog'
import type { EventWithStats } from '~/server/domains/event'
import type { Task } from '~/server/domains/task'

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
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <option value=''>{placeholder}</option>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}))

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
]

const existingTask: Task = {
  id: 'task-1',
  weddingId: 'wedding-1',
  eventId: 'event-1',
  vendorId: null,
  milestoneId: null,
  seedKey: null,
  title: 'Confirm florist timing',
  category: TaskCategory.VENDORS,
  monthsBeforeWedding: 3,
  dueDate: new Date('2026-07-01T00:00:00.000Z'),
  description: 'Bring the bouquet mockup.',
  notes: null,
  isDefault: false,
  position: 0,
  completed: false,
  completedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

describe('TaskDialog', () => {
  it('submits a new task with the primary event as the default event', async () => {
    const onSubmit = jest.fn()

    render(
      <TaskDialog
        mode='create'
        open
        onOpenChange={jest.fn()}
        events={initialEvents}
        onSubmit={onSubmit}
        isSubmitting={false}
      />
    )

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Book the string quartet' },
    })
    fireEvent.change(screen.getAllByLabelText('mock-select')[0], {
      target: { value: TaskCategory.VENDORS },
    })
    fireEvent.change(screen.getByLabelText('Months before wedding'), {
      target: { value: '6' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save task' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        category: TaskCategory.VENDORS,
        description: null,
        dueDate: null,
        eventId: 'event-1',
        monthsBeforeWedding: 6,
        notes: null,
        title: 'Book the string quartet',
      })
    )
  })

  it('preloads an existing task in edit mode and submits the updated values', async () => {
    const onSubmit = jest.fn()

    render(
      <TaskDialog
        mode='edit'
        open
        onOpenChange={jest.fn()}
        events={initialEvents}
        task={existingTask}
        onSubmit={onSubmit}
        isSubmitting={false}
      />
    )

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Confirm florist arrival time' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        category: TaskCategory.VENDORS,
        description: 'Bring the bouquet mockup.',
        dueDate: '2026-07-01',
        eventId: 'event-1',
        monthsBeforeWedding: 3,
        notes: null,
        title: 'Confirm florist arrival time',
      })
    )
  })

  it('does not submit when months before wedding is blank', async () => {
    const onSubmit = jest.fn()

    render(
      <TaskDialog
        mode='create'
        open
        onOpenChange={jest.fn()}
        events={initialEvents}
        onSubmit={onSubmit}
        isSubmitting={false}
      />
    )

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Hold space for thank-you notes' },
    })
    fireEvent.change(screen.getByLabelText('Months before wedding'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save task' }))

    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled())
    expect(await screen.findByText('Months before wedding is required')).toBeInTheDocument()
  })
})
