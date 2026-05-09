import { VendorCategory, VendorStatus } from '@prisma/client'
import { fireEvent, render, screen } from '@testing-library/react'

import { VendorDetailPanel } from '~/components/vendor/vendor-detail-panel'
import type { VendorRatingSummary } from '~/server/domains/vendor/vendor.types'

const mockUpdateMutate = jest.fn()
const mockAddNoteMutate = jest.fn()
const mockInvalidate = jest.fn()
const mockRefetchVendor = jest.fn()
const mockRefetchNotes = jest.fn()

jest.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
  }),
}))

jest.mock('~/lib/blob', () => ({
  uploadFiles: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('~/components/vendor/file-viewer-drawer', () => ({
  FileViewerDrawer: () => null,
  getViewableFileType: () => null,
}))

jest.mock('~/components/vendor/vendor-image-gallery', () => ({
  VendorImageGallery: () => <div data-testid='vendor-image-gallery' />,
}))

jest.mock('~/components/vendor/quote-form', () => ({
  QuoteForm: () => <div data-testid='quote-form'>Quote form</div>,
}))

jest.mock('~/components/vendor/vendor-form', () => ({
  VendorForm: () => <div data-testid='vendor-form'>Vendor form</div>,
}))

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({
      vendor: {
        getAll: {
          invalidate: (...args: unknown[]) => mockInvalidate(...args),
        },
        getById: {
          invalidate: jest.fn(),
        },
      },
    }),
    vendor: {
      getById: {
        useQuery: (_input: unknown, options: { initialData?: unknown }) => ({
          data: options.initialData,
          refetch: mockRefetchVendor,
        }),
      },
      updateStatus: {
        useMutation: () => ({
          mutate: jest.fn(),
          isPending: false,
        }),
      },
      deleteQuote: {
        useMutation: () => ({
          mutate: jest.fn(),
          isPending: false,
        }),
      },
      deleteQuoteFile: {
        useMutation: () => ({
          mutate: jest.fn(),
          isPending: false,
        }),
      },
      update: {
        useMutation: () => ({
          mutate: (...args: unknown[]) => mockUpdateMutate(...args),
          isPending: false,
        }),
      },
      getNotes: {
        useQuery: () => ({
          data: [
            {
              id: 'note-1',
              vendorId: 'vendor-1',
              message: 'Reached out over email',
              actorType: 'couple',
              createdAt: new Date('2026-01-03T00:00:00.000Z'),
            },
          ],
          refetch: mockRefetchNotes,
        }),
      },
      addNote: {
        useMutation: () => ({
          mutate: (...args: unknown[]) => mockAddNoteMutate(...args),
          isPending: false,
        }),
      },
      setRating: {
        useMutation: () => ({
          mutate: jest.fn(),
          isPending: false,
        }),
      },
      getCategoryConfig: {
        useQuery: () => ({
          data: {
            id: 'config-1',
            category: VendorCategory.CATERING,
            fieldDefinitions: [
              { key: 'guest_minimum', label: 'Guest Minimum', type: 'number', displayOrder: 0 },
              {
                key: 'allows_outside_alcohol',
                label: 'Allows Outside Alcohol',
                type: 'boolean',
                displayOrder: 1,
              },
            ],
          },
        }),
      },
      saveImages: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
        }),
      },
      deleteImage: {
        useMutation: () => ({
          mutate: jest.fn(),
          isPending: false,
        }),
      },
      setCoverImage: {
        useMutation: () => ({
          mutate: jest.fn(),
          isPending: false,
        }),
      },
      fetchWebsiteImages: {
        useQuery: () => ({
          data: [],
          isFetching: false,
          refetch: jest.fn(),
        }),
      },
      saveQuoteFiles: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
        }),
      },
    },
  },
}))

type TestVendor = {
  id: string
  weddingId: string
  category: VendorCategory
  name: string
  location: string | null
  website: string | null
  instagram: string | null
  status: VendorStatus
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  createdAt: Date
  updatedAt: Date
  quotes: []
  images: []
  ratingSummary: VendorRatingSummary
  contacted: boolean
  notes: string | null
  customFields: Record<string, string> | null
}

const vendor: TestVendor = {
  id: 'vendor-1',
  weddingId: 'wedding-1',
  category: VendorCategory.CATERING,
  name: 'Dragonfire Catering',
  location: 'Spokane',
  website: 'https://dragonfire.example.com',
  instagram: '@dragonfire',
  status: VendorStatus.IN_REVIEW,
  contactName: 'Dana Dragon',
  contactEmail: 'dana@example.com',
  contactPhone: '555-0100',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  quotes: [],
  images: [],
  ratingSummary: {
    average: null,
    ratings: [],
    currentUserRating: null,
  },
  contacted: false,
  notes: 'Strong tasting menu.',
  customFields: {
    guest_minimum: '80',
    allows_outside_alcohol: 'false',
  },
}

describe('VendorDetailPanel', () => {
  beforeEach(() => {
    mockUpdateMutate.mockReset()
    mockAddNoteMutate.mockReset()
    mockInvalidate.mockReset()
    mockRefetchVendor.mockReset()
    mockRefetchNotes.mockReset()
  })

  it('persists contacted, scratchpad notes, interaction notes, and custom field updates', () => {
    render(<VendorDetailPanel vendor={vendor} onClose={jest.fn()} />)

    fireEvent.click(screen.getByRole('switch', { name: /mark vendor as contacted/i }))
    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorId: 'vendor-1',
        contacted: true,
      }),
      expect.anything()
    )

    fireEvent.change(screen.getByLabelText(/scratchpad notes/i), {
      target: { value: 'Follow up on late-night snacks.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save scratchpad/i }))
    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorId: 'vendor-1',
        notes: 'Follow up on late-night snacks.',
      }),
      expect.anything()
    )

    fireEvent.change(screen.getByLabelText(/add interaction note/i), {
      target: { value: 'Scheduled a tasting for next week.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(mockAddNoteMutate).toHaveBeenCalledWith(
      {
        vendorId: 'vendor-1',
        message: 'Scheduled a tasting for next week.',
      },
      expect.anything()
    )

    fireEvent.click(screen.getByRole('checkbox', { name: /allows outside alcohol/i }))
    fireEvent.change(screen.getByLabelText(/guest minimum/i), { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: /save custom fields/i }))
    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorId: 'vendor-1',
        customFields: {
          guest_minimum: '100',
          allows_outside_alcohol: 'true',
        },
      }),
      expect.anything()
    )
  })
})
