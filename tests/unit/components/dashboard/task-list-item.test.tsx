import { fireEvent, render, screen } from '@testing-library/react'

import { TaskListItem } from '~/components/dashboard/planning-overview/task-list-item'

describe('TaskListItem', () => {
  it('renders task text and invokes onToggle with task id', () => {
    const onToggle = jest.fn()

    render(
      <TaskListItem
        task={{
          id: 'task-1',
          text: 'Confirm catering headcount',
          tag: 'Urgent',
          due: 'This week',
          done: false,
          urgent: true,
        }}
        onToggle={onToggle}
      />
    )

    const button = screen.getByRole('button', { name: /confirm catering headcount/i })
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(onToggle).toHaveBeenCalledWith('task-1')
  })
})
