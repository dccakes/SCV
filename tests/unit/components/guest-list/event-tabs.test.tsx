import { render, screen } from '@testing-library/react'

import { WorkspaceCapabilitiesProvider } from '~/components/contexts/workspace-capabilities-context'
import EventsTabs from '~/components/guest-list/event-tabs'

jest.mock('~/components/contexts/event-form-context', () => ({
  useToggleEventForm: () => jest.fn(),
}))

const events = [{ id: 'e1', name: 'Ceremony' }] as unknown as Parameters<
  typeof EventsTabs
>[0]['events']

describe('EventsTabs permissions', () => {
  it('shows the new event button to editors', () => {
    render(
      <WorkspaceCapabilitiesProvider canEditPlanning={true}>
        <EventsTabs events={events} selectedEventId='all' />
      </WorkspaceCapabilitiesProvider>
    )
    expect(screen.getByRole('button', { name: '+ New Event' })).toBeInTheDocument()
  })

  it('hides the new event button for viewers but keeps the tabs', () => {
    render(
      <WorkspaceCapabilitiesProvider canEditPlanning={false}>
        <EventsTabs events={events} selectedEventId='all' />
      </WorkspaceCapabilitiesProvider>
    )
    expect(screen.queryByRole('button', { name: '+ New Event' })).not.toBeInTheDocument()
    expect(screen.getByText('Ceremony')).toBeInTheDocument()
  })
})
