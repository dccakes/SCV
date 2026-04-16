import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { TagsModal } from '~/components/forms/guest/tags-modal'

const mockRefetchTags = jest.fn()
const mockMutateAsync = jest.fn().mockResolvedValue({ id: 'new-tag-id' })

jest.mock('~/trpc/react', () => ({
  api: {
    guestTag: {
      getAll: {
        useQuery: () => ({
          data: [
            { id: 'tag-1', name: 'Family', color: '#16A34A' },
            { id: 'tag-2', name: 'Friends', color: '#0EA5E9' },
            { id: 'tag-3', name: 'VIP', color: '#7C3AED' },
          ],
          refetch: mockRefetchTags,
        }),
      },
      create: {
        useMutation: () => ({
          mutateAsync: mockMutateAsync,
          isPending: false,
        }),
      },
    },
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const renderModal = (
  overrides: {
    open?: boolean
    selectedTagIds?: string[]
    onTagsChange?: jest.Mock
    onOpenChange?: jest.Mock
    guestName?: string
  } = {}
) => {
  const onTagsChange = overrides.onTagsChange ?? jest.fn()
  const onOpenChange = overrides.onOpenChange ?? jest.fn()

  const view = render(
    <TagsModal
      open={overrides.open ?? true}
      onOpenChange={onOpenChange}
      selectedTagIds={overrides.selectedTagIds ?? []}
      onTagsChange={onTagsChange}
      guestName={overrides.guestName ?? 'John Doe'}
    />
  )

  return { ...view, onTagsChange, onOpenChange }
}

describe('TagsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders available tags when open', () => {
    renderModal()

    expect(screen.getByText('Family')).toBeInTheDocument()
    expect(screen.getByText('Friends')).toBeInTheDocument()
    expect(screen.getByText('VIP')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    renderModal({ open: false })

    expect(screen.queryByText('Family')).not.toBeInTheDocument()
  })

  it('shows pre-selected tags as checked', () => {
    renderModal({ selectedTagIds: ['tag-1', 'tag-3'] })

    const familyCheckbox = screen.getByRole('checkbox', { name: 'Family' })
    const vipCheckbox = screen.getByRole('checkbox', { name: 'VIP' })
    const friendsCheckbox = screen.getByRole('checkbox', { name: 'Friends' })

    expect(familyCheckbox).toBeChecked()
    expect(vipCheckbox).toBeChecked()
    expect(friendsCheckbox).not.toBeChecked()
  })

  it('displays selected tags count in header', () => {
    renderModal({ selectedTagIds: ['tag-1', 'tag-2'] })

    expect(screen.getByText('Selected (2/10)')).toBeInTheDocument()
  })

  it('displays guest name in title', () => {
    renderModal({ guestName: 'Jane Smith' })

    expect(screen.getByText('Tags for Jane Smith')).toBeInTheDocument()
  })

  it('toggling a checkbox updates local selection', () => {
    renderModal({ selectedTagIds: ['tag-1'] })

    // Add Friends
    const friendsCheckbox = screen.getByRole('checkbox', { name: 'Friends' })
    fireEvent.click(friendsCheckbox)

    // Should now show 2 selected
    expect(screen.getByText('Selected (2/10)')).toBeInTheDocument()
  })

  it('Save Tags calls onTagsChange with selected IDs', () => {
    const onTagsChange = jest.fn()
    renderModal({ selectedTagIds: ['tag-1'], onTagsChange })

    // Add Friends
    fireEvent.click(screen.getByRole('checkbox', { name: 'Friends' }))

    // Click Save Tags
    fireEvent.click(screen.getByRole('button', { name: 'Save Tags' }))

    expect(onTagsChange).toHaveBeenCalledWith(['tag-1', 'tag-2'])
  })

  it('Cancel does not call onTagsChange', () => {
    const onTagsChange = jest.fn()
    const onOpenChange = jest.fn()
    renderModal({ selectedTagIds: ['tag-1'], onTagsChange, onOpenChange })

    // Toggle a tag
    fireEvent.click(screen.getByRole('checkbox', { name: 'Friends' }))

    // Click Cancel
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onTagsChange).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('TagsModal - state sync on reopen (bug fix)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('resets local state to selectedTagIds when modal reopens after cancel', () => {
    const onTagsChange = jest.fn()
    const onOpenChange = jest.fn()

    const { rerender } = render(
      <TagsModal
        open={true}
        onOpenChange={onOpenChange}
        selectedTagIds={['tag-1', 'tag-2']}
        onTagsChange={onTagsChange}
        guestName='John Doe'
      />
    )

    // Verify initial state: Family and Friends checked
    expect(screen.getByRole('checkbox', { name: 'Family' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Friends' })).toBeChecked()

    // User deselects Family and selects VIP
    fireEvent.click(screen.getByRole('checkbox', { name: 'Family' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'VIP' }))

    // Verify local state changed
    expect(screen.getByRole('checkbox', { name: 'Family' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'VIP' })).toBeChecked()

    // User cancels (close modal)
    rerender(
      <TagsModal
        open={false}
        onOpenChange={onOpenChange}
        selectedTagIds={['tag-1', 'tag-2']}
        onTagsChange={onTagsChange}
        guestName='John Doe'
      />
    )

    // Reopen modal - local state should reset to prop values
    rerender(
      <TagsModal
        open={true}
        onOpenChange={onOpenChange}
        selectedTagIds={['tag-1', 'tag-2']}
        onTagsChange={onTagsChange}
        guestName='John Doe'
      />
    )

    // Should be back to original state (Family + Friends), not stale state
    expect(screen.getByRole('checkbox', { name: 'Family' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Friends' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'VIP' })).not.toBeChecked()
  })

  it('reflects updated selectedTagIds when modal reopens after a save', () => {
    const onTagsChange = jest.fn()
    const onOpenChange = jest.fn()

    const { rerender } = render(
      <TagsModal
        open={true}
        onOpenChange={onOpenChange}
        selectedTagIds={['tag-1']}
        onTagsChange={onTagsChange}
        guestName='John Doe'
      />
    )

    // User adds VIP and saves
    fireEvent.click(screen.getByRole('checkbox', { name: 'VIP' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save Tags' }))

    expect(onTagsChange).toHaveBeenCalledWith(['tag-1', 'tag-3'])

    // Close modal
    rerender(
      <TagsModal
        open={false}
        onOpenChange={onOpenChange}
        selectedTagIds={['tag-1', 'tag-3']}
        onTagsChange={onTagsChange}
        guestName='John Doe'
      />
    )

    // Reopen with updated selectedTagIds (as parent form would provide)
    rerender(
      <TagsModal
        open={true}
        onOpenChange={onOpenChange}
        selectedTagIds={['tag-1', 'tag-3']}
        onTagsChange={onTagsChange}
        guestName='John Doe'
      />
    )

    // Should show the saved state
    expect(screen.getByRole('checkbox', { name: 'Family' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'VIP' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Friends' })).not.toBeChecked()
  })

  it('resets create tag sub-form when modal reopens', async () => {
    const { rerender } = render(
      <TagsModal
        open={true}
        onOpenChange={jest.fn()}
        selectedTagIds={[]}
        onTagsChange={jest.fn()}
        guestName='John Doe'
      />
    )

    // Open create tag form
    fireEvent.click(screen.getByRole('button', { name: /Create New Tag/i }))
    expect(screen.getByLabelText('Tag Name')).toBeInTheDocument()

    // Close modal
    rerender(
      <TagsModal
        open={false}
        onOpenChange={jest.fn()}
        selectedTagIds={[]}
        onTagsChange={jest.fn()}
        guestName='John Doe'
      />
    )

    // Reopen modal
    rerender(
      <TagsModal
        open={true}
        onOpenChange={jest.fn()}
        selectedTagIds={[]}
        onTagsChange={jest.fn()}
        guestName='John Doe'
      />
    )

    // Create tag form should be hidden
    await waitFor(() => {
      expect(screen.queryByLabelText('Tag Name')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Create New Tag/i })).toBeInTheDocument()
  })
})

describe('TagsModal - tag limit', () => {
  it('disables unchecked tags when 10 are selected', () => {
    const tenTagIds = Array.from({ length: 10 }, (_, i) => `tag-fill-${i}`)
    renderModal({ selectedTagIds: tenTagIds })

    // The 3 available tags (Family, Friends, VIP) should all be disabled
    // since none are in the selected set and limit is reached
    const familyCheckbox = screen.getByRole('checkbox', { name: 'Family' })
    expect(familyCheckbox).toBeDisabled()
  })
})
