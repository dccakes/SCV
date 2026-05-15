import { render, screen } from '@testing-library/react'

import { VendorNoteTimeline } from '~/components/vendor/vendor-note-timeline'

describe('VendorNoteTimeline', () => {
  it('renders actor badges and note messages', () => {
    render(
      <VendorNoteTimeline
        notes={[
          {
            id: 'note-1',
            vendorId: 'vendor-1',
            message: 'Sent first inquiry',
            actorType: 'couple',
            createdAt: new Date('2026-01-05T10:00:00.000Z'),
          },
          {
            id: 'note-2',
            vendorId: 'vendor-1',
            message: 'Suggested comparing guest minimums',
            actorType: 'etta',
            createdAt: new Date('2026-01-04T10:00:00.000Z'),
          },
        ]}
      />
    )

    expect(screen.getByText('you')).toBeInTheDocument()
    expect(screen.getByText('Etta')).toBeInTheDocument()
    expect(screen.getByText('Sent first inquiry')).toBeInTheDocument()
    expect(screen.getByText('Suggested comparing guest minimums')).toBeInTheDocument()
  })
})
