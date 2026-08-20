import { fireEvent, render, screen } from '@testing-library/react'

import { MilestoneDetail } from '~/components/checklist/milestone-detail'
import type { MilestoneWithEffectiveStatus } from '~/server/domains/milestone'

const attestMilestone = jest.fn()
const dismissMilestone = jest.fn()
const clearOverride = jest.fn()

const milestone: MilestoneWithEffectiveStatus = {
  id: 'milestone-1',
  weddingId: 'wedding-1',
  key: 'marriage_license_obtained',
  title: 'Marriage license obtained',
  category: 'LEGAL',
  position: 10,
  targetDate: null,
  userOverrideStatus: null,
  attestedAt: null,
  dismissedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  derivedStatus: 'pending',
  effectiveStatus: 'pending',
}

describe('MilestoneDetail', () => {
  beforeEach(() => {
    attestMilestone.mockReset()
    dismissMilestone.mockReset()
    clearOverride.mockReset()
  })

  it('renders effective and derived status and lets the user attest or dismiss from the system default', () => {
    render(
      <MilestoneDetail
        milestone={milestone}
        trigger={<button type='button'>Open milestone</button>}
        onAttest={attestMilestone}
        onDismiss={dismissMilestone}
        onClearOverride={clearOverride}
        viewport='desktop'
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open milestone' }))

    expect(screen.getByText('Effective status: pending')).toBeInTheDocument()
    expect(screen.getByText('System status: pending')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Mark as done'))
    expect(attestMilestone).toHaveBeenCalledWith('milestone-1')

    fireEvent.click(screen.getByLabelText('Mark as not done'))
    expect(dismissMilestone).toHaveBeenCalledWith('milestone-1')
  })

  it('lets the user clear an existing override to fall back to the system status', () => {
    render(
      <MilestoneDetail
        milestone={{ ...milestone, userOverrideStatus: 'attested' }}
        trigger={<button type='button'>Open milestone</button>}
        onAttest={attestMilestone}
        onDismiss={dismissMilestone}
        onClearOverride={clearOverride}
        viewport='desktop'
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open milestone' }))

    fireEvent.click(screen.getByLabelText('Use system status'))
    expect(clearOverride).toHaveBeenCalledWith('milestone-1')
  })

  it('uses the mobile dialog presentation when requested', () => {
    render(
      <MilestoneDetail
        milestone={milestone}
        trigger={<button type='button'>Open mobile milestone</button>}
        onAttest={attestMilestone}
        onDismiss={dismissMilestone}
        onClearOverride={clearOverride}
        viewport='mobile'
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open mobile milestone' }))

    expect(screen.getByRole('dialog', { name: 'Marriage license obtained' })).toBeInTheDocument()
  })
})
