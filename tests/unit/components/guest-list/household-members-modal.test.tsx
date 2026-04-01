import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
  type HouseholdMemberDraft,
  HouseholdMembersModal,
} from '~/components/guest-list/household-members-modal'

jest.mock('~/components/guest-list/tag-input', () => ({
  TagInput: ({ ariaLabel }: { ariaLabel: string }) => <div data-testid={ariaLabel} />,
}))

jest.mock('~/trpc/react', () => ({
  api: {
    guestTag: {
      getAll: {
        useQuery: () => ({ data: [], refetch: jest.fn() }),
      },
    },
  },
}))

jest.mock('~/components/ui/select', () => {
  const React = require('react')
  return {
    Select: ({
      children,
      value,
      onValueChange,
    }: {
      children: React.ReactNode
      value: string
      onValueChange: (v: string) => void
    }) => (
      <div data-testid='select-root' data-value={value}>
        {React.Children.map(children, (child: React.ReactElement) =>
          React.isValidElement(child)
            ? React.cloneElement(child, {
                __value: value,
                __onValueChange: onValueChange,
              } as Record<string, unknown>)
            : child
        )}
      </div>
    ),
    SelectTrigger: ({
      children,
      'aria-label': ariaLabel,
      __value,
    }: {
      children: React.ReactNode
      'aria-label': string
      __value?: string
    }) => (
      <button type='button' aria-label={ariaLabel} data-value={__value}>
        {children}
      </button>
    ),
    SelectValue: ({ __value }: { __value?: string }) => {
      const labels: Record<string, string> = {
        ADULT: 'Adult (18+ years)',
        TEEN: 'Teen (13-17 years)',
        CHILD: 'Child (3-12 years)',
        INFANT: 'Infant (0-2 years)',
      }
      return <span>{labels[__value ?? 'ADULT'] ?? __value}</span>
    },
    SelectContent: ({
      children,
      __onValueChange,
    }: {
      children: React.ReactNode
      __onValueChange?: (v: string) => void
    }) => (
      <div data-testid='select-content'>
        {React.Children.map(children, (child: React.ReactElement) =>
          React.isValidElement(child)
            ? React.cloneElement(child, { __onValueChange } as Record<string, unknown>)
            : child
        )}
      </div>
    ),
    SelectItem: ({
      children,
      value,
      __onValueChange,
    }: {
      children: React.ReactNode
      value: string
      __onValueChange?: (v: string) => void
    }) => (
      // biome-ignore lint/a11y/useFocusableInteractive: test mock
      // biome-ignore lint/a11y/useKeyWithClickEvents: test mock
      <div role='option' data-value={value} onClick={() => __onValueChange?.(value)}>
        {children}
      </div>
    ),
  }
})

const makeMember = (overrides: Partial<HouseholdMemberDraft> = {}): HouseholdMemberDraft => ({
  firstName: 'John',
  lastName: 'Doe',
  email: null,
  phone: null,
  tagIds: [],
  ageGroup: 'ADULT',
  isPrimaryContact: true,
  isTagAlong: false,
  ...overrides,
})

const defaultMembers: HouseholdMemberDraft[] = [
  makeMember({ firstName: 'John', lastName: 'Doe', isPrimaryContact: true }),
  makeMember({ firstName: 'Jane', lastName: 'Doe', isPrimaryContact: false }),
]

const renderModal = (
  overrides: {
    open?: boolean
    members?: HouseholdMemberDraft[]
    onOpenChange?: jest.Mock
    onSave?: jest.Mock
  } = {}
) => {
  const onOpenChange = overrides.onOpenChange ?? jest.fn()
  const onSave = overrides.onSave ?? jest.fn().mockResolvedValue(true)

  const view = render(
    <HouseholdMembersModal
      open={overrides.open ?? true}
      members={overrides.members ?? defaultMembers}
      onOpenChange={onOpenChange}
      onSave={onSave}
    />
  )

  return { ...view, onOpenChange, onSave }
}

describe('HouseholdMembersModal', () => {
  it('renders member names when open', () => {
    renderModal()

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    renderModal({ open: false })

    expect(screen.queryByText('Manage Household Members')).not.toBeInTheDocument()
  })

  it('shows correct first and last name input values', () => {
    renderModal()

    const firstNameInputs = screen.getAllByLabelText(/First name/)
    const lastNameInputs = screen.getAllByLabelText(/Last name/)

    expect(firstNameInputs[0]).toHaveValue('John')
    expect(lastNameInputs[0]).toHaveValue('Doe')
    expect(firstNameInputs[1]).toHaveValue('Jane')
    expect(lastNameInputs[1]).toHaveValue('Doe')
  })

  it('editing first name updates the member display name', () => {
    renderModal()

    const firstNameInput = screen.getByLabelText('First name (member 1)')
    fireEvent.change(firstNameInput, { target: { value: 'Jonathan' } })

    expect(screen.getByText('Jonathan Doe')).toBeInTheDocument()
  })

  it('age group select shows correct value and can be changed', () => {
    renderModal({
      members: [makeMember({ firstName: 'John', lastName: 'Doe', ageGroup: 'ADULT' })],
    })

    const trigger = screen.getByLabelText('Age group for John Doe')
    expect(trigger).toBeInTheDocument()
    expect(screen.getAllByText('Adult (18+ years)').length).toBeGreaterThan(0)

    const teenOption = screen.getByText('Teen (13-17 years)')
    fireEvent.click(teenOption)

    expect(screen.getByText('Teen (13-17 years)')).toBeInTheDocument()
  })

  it('add guest button adds a new empty member row', () => {
    renderModal()

    const addButton = screen.getByRole('button', { name: 'Add guest' })
    fireEvent.click(addButton)

    expect(screen.getByText('Unnamed guest')).toBeInTheDocument()
    expect(screen.getAllByLabelText(/First name/)).toHaveLength(3)
  })

  it('remove button removes a member', () => {
    renderModal()

    const removeButton = screen.getByLabelText('Remove Jane Doe')
    fireEvent.click(removeButton)

    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
    expect(screen.getAllByLabelText(/First name/)).toHaveLength(1)
  })

  it('set primary button changes primary contact', () => {
    renderModal()

    const setPrimaryButton = screen.getByLabelText('Set Jane Doe as primary')
    fireEvent.click(setPrimaryButton)

    expect(screen.getByLabelText('Set John Doe as primary')).not.toBeDisabled()
    expect(screen.getByLabelText('Set Jane Doe as primary')).toBeDisabled()
  })

  it('tag-along toggle works and disables set primary', () => {
    renderModal()

    const tagAlongButton = screen.getByLabelText('Toggle tag-along for Jane Doe')
    fireEvent.click(tagAlongButton)

    expect(screen.getByLabelText('Set Jane Doe as primary')).toBeDisabled()
  })

  it('shows validation error when names are empty and disables save', () => {
    renderModal({
      members: [makeMember({ firstName: '', lastName: '' })],
    })

    expect(
      screen.getByText('Each household member must include a first and last name.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save members' })).toBeDisabled()
  })

  it('shows validation error when no primary is set', () => {
    renderModal({
      members: [
        makeMember({ firstName: 'John', lastName: 'Doe', isPrimaryContact: false }),
        makeMember({ firstName: 'Jane', lastName: 'Doe', isPrimaryContact: false }),
      ],
    })

    expect(screen.getByText('Choose exactly one primary household member.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save members' })).toBeDisabled()
  })

  it('save button calls onSave with draft data', async () => {
    const onSave = jest.fn().mockResolvedValue(true)
    renderModal({ onSave })

    fireEvent.click(screen.getByRole('button', { name: 'Save members' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(defaultMembers)
    })
  })

  it('cancel button calls onOpenChange with false', () => {
    const onOpenChange = jest.fn()
    renderModal({ onOpenChange })

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
