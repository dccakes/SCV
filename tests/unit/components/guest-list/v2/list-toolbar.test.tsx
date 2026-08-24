import { fireEvent, render, screen } from '@testing-library/react'

import { ListToolbar } from '~/components/guest-list/v2/list/list-toolbar'

describe('ListToolbar', () => {
  it('shows household count and sort actions', () => {
    render(<ListToolbar totalHouseholds={2} />)

    expect(screen.getByText('2 households')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sort by Name' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sort by Party Size' })).toBeInTheDocument()
  })

  it('invokes sort handlers when buttons are clicked', () => {
    const onSortByName = jest.fn()
    const onSortByPartySize = jest.fn()

    render(
      <ListToolbar
        totalHouseholds={1}
        onSortByName={onSortByName}
        onSortByPartySize={onSortByPartySize}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sort by Name' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sort by Party Size' }))

    expect(onSortByName).toHaveBeenCalledTimes(1)
    expect(onSortByPartySize).toHaveBeenCalledTimes(1)
  })

  it('shows cards as the default active view state', () => {
    render(<ListToolbar totalHouseholds={3} onViewModeChange={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Card view' })).toHaveClass('bg-primary')
    expect(screen.getByRole('button', { name: 'Table view' })).not.toHaveClass('bg-primary')
  })

  it('shows table as the active view state when requested', () => {
    render(<ListToolbar totalHouseholds={3} viewMode='table' onViewModeChange={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Table view' })).toHaveClass('bg-primary')
    expect(screen.getByRole('button', { name: 'Card view' })).not.toHaveClass('bg-primary')
  })

  it('shows workflow mode controls and calls mode change handler', () => {
    const onWorkflowModeChange = jest.fn()

    render(
      <ListToolbar
        totalHouseholds={3}
        workflowMode='households'
        onWorkflowModeChange={onWorkflowModeChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Person Audit' }))
    expect(onWorkflowModeChange).toHaveBeenCalledWith('personAudit')
  })

  it('renders active sort state text when provided', () => {
    render(<ListToolbar totalHouseholds={3} sortStateLabel='Name (A-Z)' />)
    expect(screen.getByText('Sorted by Name (A-Z)')).toBeInTheDocument()
  })

  it('highlights the name sort button when name sort is active', () => {
    render(
      <ListToolbar totalHouseholds={3} activeSort={{ field: 'name', direction: 'ascending' }} />
    )

    expect(screen.getByRole('button', { name: 'Sort by Name' })).toHaveClass('bg-primary')
    expect(screen.getByRole('button', { name: 'Sort by Party Size' })).not.toHaveClass('bg-primary')
  })

  it('highlights the party size sort button when party sort is active', () => {
    render(
      <ListToolbar
        totalHouseholds={3}
        activeSort={{ field: 'partySize', direction: 'descending' }}
      />
    )

    expect(screen.getByRole('button', { name: 'Sort by Party Size' })).toHaveClass('bg-primary')
    expect(screen.getByRole('button', { name: 'Sort by Name' })).not.toHaveClass('bg-primary')
  })

  it('shows no sort button highlighted when activeSort is not provided', () => {
    render(<ListToolbar totalHouseholds={3} />)

    expect(screen.getByRole('button', { name: 'Sort by Name' })).not.toHaveClass('bg-primary')
    expect(screen.getByRole('button', { name: 'Sort by Party Size' })).not.toHaveClass('bg-primary')
  })
})
