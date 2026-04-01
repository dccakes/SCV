import { render, screen } from '@testing-library/react'

import { OrganizationMembersReadOnlyCard } from '~/components/settings/organization-members-readonly-card'

const mockOrganizationMembersCard = jest.fn((_props: Record<string, unknown>) => (
  <div data-testid='organization-members-card'>Members</div>
))

jest.mock('@daveyplate/better-auth-ui', () => ({
  OrganizationMembersCard: (props: Record<string, unknown>) => mockOrganizationMembersCard(props),
}))

describe('OrganizationMembersReadOnlyCard', () => {
  beforeEach(() => {
    mockOrganizationMembersCard.mockClear()
  })

  it('renders Better Auth members card with read-only configuration', () => {
    render(<OrganizationMembersReadOnlyCard />)

    expect(screen.getByTestId('organization-members-card')).toBeInTheDocument()
    expect(mockOrganizationMembersCard).toHaveBeenCalledWith(
      expect.objectContaining({
        disabled: true,
        description: 'People who can access this wedding workspace.',
        instructions: 'Read-only list',
        className: 'border-0 bg-transparent shadow-none',
      })
    )
  })
})
