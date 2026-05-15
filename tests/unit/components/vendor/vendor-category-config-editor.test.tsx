import { VendorCategory } from '@prisma/client'
import { fireEvent, render, screen } from '@testing-library/react'

import { VendorCategoryConfigEditor } from '~/components/vendor/vendor-category-config-editor'

const mockMutate = jest.fn()

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('~/trpc/react', () => ({
  api: {
    vendor: {
      getCategoryConfig: {
        useQuery: () => ({
          data: {
            id: 'config-1',
            category: VendorCategory.VENUE,
            fieldDefinitions: [
              { key: 'capacity', label: 'Capacity', type: 'number', displayOrder: 0 },
            ],
          },
        }),
      },
      upsertCategoryConfig: {
        useMutation: () => ({
          mutate: (...args: unknown[]) => mockMutate(...args),
          isPending: false,
        }),
      },
    },
  },
}))

describe('VendorCategoryConfigEditor', () => {
  beforeEach(() => {
    mockMutate.mockReset()
  })

  it('creates new field keys from the initial label and does not expose key editing', () => {
    render(
      <VendorCategoryConfigEditor category={VendorCategory.VENUE} open onOpenChange={jest.fn()} />
    )

    expect(screen.queryByLabelText(/field key/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /add field/i }))
    fireEvent.change(screen.getByLabelText(/field label/i), {
      target: { value: 'Service Area ZIP Codes' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save fields/i }))

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        category: VendorCategory.VENUE,
        fieldDefinitions: [
          { key: 'capacity', label: 'Capacity', type: 'number', displayOrder: 0 },
          {
            key: 'service_area_zip_codes',
            label: 'Service Area ZIP Codes',
            type: 'text',
            displayOrder: 1,
          },
        ],
      }),
      expect.anything()
    )
  })
})
