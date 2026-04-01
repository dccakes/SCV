import { fireEvent, render, screen } from '@testing-library/react'

import { TagInput } from '~/components/guest-list/tag-input'

const mockOnToggle = jest.fn()
const mockOnTagCreated = jest.fn()
const mockMutate = jest.fn()

jest.mock('~/trpc/react', () => ({
  api: {
    guestTag: {
      create: {
        useMutation: () => ({ mutate: mockMutate }),
      },
    },
  },
}))

jest.mock('~/components/hooks', () => {
  const React = require('react')
  return {
    useOuterClick: () => React.createRef(),
  }
})

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}))

const baseTags = [
  { id: 'tag-1', name: 'VIP', color: '#ff0000' },
  { id: 'tag-2', name: 'Family', color: '#00ff00' },
  { id: 'tag-3', name: 'Friends', color: '#0000ff' },
  { id: 'tag-4', name: 'Colleagues', color: null },
]

function renderTagInput(overrides: Partial<Parameters<typeof TagInput>[0]> = {}) {
  return render(
    <TagInput
      selectedTagIds={[]}
      tags={baseTags}
      onToggle={mockOnToggle}
      onTagCreated={mockOnTagCreated}
      ariaLabel='Tags'
      {...overrides}
    />
  )
}

function getInput() {
  return screen.getByRole('textbox', { name: 'Tags' })
}

describe('TagInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders selected tags as badges', () => {
    renderTagInput({ selectedTagIds: ['tag-1', 'tag-2'] })

    expect(screen.getByText('VIP')).toBeInTheDocument()
    expect(screen.getByText('Family')).toBeInTheDocument()
    expect(screen.queryByText('Friends')).not.toBeInTheDocument()
  })

  it('renders input with placeholder when no tags selected', () => {
    renderTagInput({ selectedTagIds: [] })

    const input = getInput()
    expect(input).toHaveAttribute('placeholder', 'Type to search or create tags...')
  })

  it('typing filters the dropdown to matching tags', () => {
    renderTagInput()

    const input = getInput()
    fireEvent.change(input, { target: { value: 'fam' } })

    expect(screen.getByText('Family')).toBeInTheDocument()
    expect(screen.queryByText('VIP')).not.toBeInTheDocument()
    expect(screen.queryByText('Friends')).not.toBeInTheDocument()
  })

  it('clicking a tag in dropdown calls onToggle', () => {
    renderTagInput()

    const input = getInput()
    fireEvent.focus(input)

    fireEvent.click(screen.getByText('VIP'))

    expect(mockOnToggle).toHaveBeenCalledWith('tag-1')
  })

  it('clicking remove button on a badge calls onToggle', () => {
    renderTagInput({ selectedTagIds: ['tag-1'] })

    fireEvent.click(screen.getByRole('button', { name: 'Remove VIP' }))

    expect(mockOnToggle).toHaveBeenCalledWith('tag-1')
  })

  it('shows "Create" option when typing a name that does not exist', () => {
    renderTagInput()

    const input = getInput()
    fireEvent.change(input, { target: { value: 'NewTag' } })

    expect(screen.getByText('Create')).toBeInTheDocument()
    expect(screen.getByText('NewTag')).toBeInTheDocument()
  })

  it('backspace on empty input removes last selected tag', () => {
    renderTagInput({ selectedTagIds: ['tag-1', 'tag-2'] })

    const input = getInput()
    fireEvent.keyDown(input, { key: 'Backspace' })

    expect(mockOnToggle).toHaveBeenCalledWith('tag-2')
  })

  it('enter key selects highlighted option', () => {
    renderTagInput()

    const input = getInput()
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockOnToggle).toHaveBeenCalledWith('tag-1')
  })

  it('escape closes the dropdown', () => {
    renderTagInput()

    const input = getInput()
    fireEvent.focus(input)

    expect(screen.getByText('VIP')).toBeInTheDocument()

    fireEvent.keyDown(input, { key: 'Escape' })

    expect(screen.queryByText('VIP')).not.toBeInTheDocument()
  })

  it('does not allow selecting more tags when at max', () => {
    const maxSelectedIds = Array.from({ length: 10 }, (_, i) => `tag-fill-${i}`)
    const maxTags = maxSelectedIds.map((id, i) => ({
      id,
      name: `Fill ${i}`,
      color: null,
    }))

    renderTagInput({
      selectedTagIds: maxSelectedIds,
      tags: [...maxTags, { id: 'tag-extra', name: 'Extra', color: null }],
    })

    const input = getInput()
    fireEvent.change(input, { target: { value: 'Extra' } })

    const extraButton = screen.getByText('Extra').closest('button')
    expect(extraButton).toBeDisabled()
  })

  it('create option calls the mutation', () => {
    renderTagInput()

    const input = getInput()
    fireEvent.change(input, { target: { value: 'NewTag' } })
    const createButton = screen.getByText('Create').closest('button')
    expect(createButton).not.toBeNull()
    fireEvent.click(createButton as HTMLElement)

    expect(mockMutate).toHaveBeenCalledWith({
      name: 'NewTag',
      color: expect.any(String),
    })
  })
})
