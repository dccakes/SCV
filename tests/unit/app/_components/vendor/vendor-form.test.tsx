import { VendorCategory, VendorStatus } from '@prisma/client'
import { fireEvent, render, screen } from '@testing-library/react'

import { VendorForm } from '~/app/_components/vendor/vendor-form'

const mockCreateMutate = jest.fn()
const mockUpdateMutate = jest.fn()

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({
      vendor: {
        getAll: {
          invalidate: jest.fn(),
        },
      },
    }),
    vendor: {
      create: {
        useMutation: () => ({
          mutate: (...args: unknown[]) => mockCreateMutate(...args),
          isPending: false,
        }),
      },
      update: {
        useMutation: () => ({
          mutate: (...args: unknown[]) => mockUpdateMutate(...args),
          isPending: false,
        }),
      },
    },
  },
}))

describe('VendorForm', () => {
  beforeEach(() => {
    mockCreateMutate.mockReset()
    mockUpdateMutate.mockReset()
  })

  it('shows category selector in create mode', () => {
    render(
      <VendorForm
        mode='create'
        defaultCategory={VendorCategory.CATERING}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    )

    expect(screen.getByText('Category')).toBeInTheDocument()
  })

  it('hides category selector in edit mode', () => {
    render(
      <VendorForm
        mode='edit'
        vendor={{
          id: 'vendor-1',
          weddingId: 'wedding-1',
          category: VendorCategory.CATERING,
          status: VendorStatus.IN_REVIEW,
          name: 'Sample Vendor',
          location: null,
          website: null,
          instagram: null,
          contactName: null,
          contactEmail: null,
          contactPhone: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    )

    expect(screen.queryByText('Category')).not.toBeInTheDocument()
  })

  it('submits create payload in create mode', () => {
    render(
      <VendorForm
        mode='create'
        defaultCategory={VendorCategory.MUSIC}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Vendor or business name'), {
      target: { value: 'Band' },
    })
    fireEvent.click(screen.getByRole('button', { name: /add vendor/i }))

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        category: VendorCategory.MUSIC,
        name: 'Band',
      })
    )
    expect(mockUpdateMutate).not.toHaveBeenCalled()
  })

  it('submits update payload in edit mode', () => {
    render(
      <VendorForm
        mode='edit'
        vendor={{
          id: 'vendor-1',
          weddingId: 'wedding-1',
          category: VendorCategory.CATERING,
          status: VendorStatus.IN_REVIEW,
          name: 'Sample Vendor',
          location: null,
          website: null,
          instagram: null,
          contactName: null,
          contactEmail: null,
          contactPhone: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Vendor or business name'), {
      target: { value: 'Updated Vendor' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorId: 'vendor-1',
        name: 'Updated Vendor',
      })
    )
    expect(mockCreateMutate).not.toHaveBeenCalled()
  })
})
