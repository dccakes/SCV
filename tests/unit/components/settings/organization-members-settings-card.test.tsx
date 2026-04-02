import { render, screen } from '@testing-library/react'

import { OrganizationMembersSettingsCard } from '~/components/settings/organization-members-settings-card'

const mockOrganizationMembersCard = jest.fn((_props: Record<string, unknown>) => (
  <div data-testid='organization-members-card'>Members</div>
))

jest.mock('@daveyplate/better-auth-ui', () => ({
  OrganizationMembersCard: (props: Record<string, unknown>) => mockOrganizationMembersCard(props),
}))

describe('OrganizationMembersSettingsCard', () => {
  beforeEach(() => {
    mockOrganizationMembersCard.mockClear()
  })

  it('renders Better Auth members card with member-management copy', () => {
    render(<OrganizationMembersSettingsCard />)

    expect(screen.getByTestId('organization-members-card')).toBeInTheDocument()
    expect(mockOrganizationMembersCard).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Invite collaborators and manage who can access this wedding workspace.',
        className: 'border-0 bg-transparent shadow-none',
      })
    )
  })

  it('keeps actions enabled so Better Auth can enforce permissions by role', () => {
    render(<OrganizationMembersSettingsCard />)

    expect(mockOrganizationMembersCard).toHaveBeenCalledWith(
      expect.not.objectContaining({
        disabled: true,
      })
    )
    expect(mockOrganizationMembersCard).toHaveBeenCalledWith(
      expect.objectContaining({
        classNames: expect.not.objectContaining({
          button: 'hidden',
        }),
      })
    )
  })
})
