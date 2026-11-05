import { QuoteType, VendorCategory, VendorStatus } from '@prisma/client'
import { fireEvent, render, screen } from '@testing-library/react'

import { WorkspaceCapabilitiesProvider } from '~/components/contexts/workspace-capabilities-context'
import { VendorDetailPanel } from '~/components/vendor/vendor-detail-panel'

jest.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
  }),
}))

jest.mock('~/lib/blob', () => ({ uploadFiles: jest.fn() }))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

jest.mock('~/components/vendor/file-viewer-drawer', () => ({
  FileViewerDrawer: ({ file }: { file: { name: string } | null }) =>
    file ? <div data-testid='file-viewer'>{file.name}</div> : null,
  getViewableFileType: (name: string) => (name.endsWith('.pdf') ? 'pdf' : null),
}))
jest.mock('~/components/vendor/vendor-image-gallery', () => ({
  VendorImageGallery: () => <div data-testid='vendor-image-gallery' />,
}))
jest.mock('~/components/vendor/quote-form', () => ({
  QuoteForm: () => <div data-testid='quote-form' />,
}))
jest.mock('~/components/vendor/vendor-form', () => ({
  VendorForm: () => <div data-testid='vendor-form' />,
}))

const mutation = () => ({ mutate: jest.fn(), mutateAsync: jest.fn(), isPending: false })

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({ vendor: { getAll: { invalidate: jest.fn() } } }),
    vendor: {
      getById: {
        useQuery: (_input: unknown, options: { initialData?: unknown }) => ({
          data: options.initialData,
          refetch: jest.fn(),
        }),
      },
      updateStatus: { useMutation: () => mutation() },
      deleteQuote: { useMutation: () => mutation() },
      deleteQuoteFile: { useMutation: () => mutation() },
      update: { useMutation: () => mutation() },
      addNote: { useMutation: () => mutation() },
      setRating: { useMutation: () => mutation() },
      saveQuoteFiles: { useMutation: () => mutation() },
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
          refetch: jest.fn(),
        }),
      },
      getCategoryConfig: {
        useQuery: () => ({
          data: {
            id: 'config-1',
            category: VendorCategory.CATERING,
            fieldDefinitions: [
              { key: 'guest_minimum', label: 'Guest Minimum', type: 'number', displayOrder: 0 },
            ],
          },
        }),
      },
    },
  },
}))

const vendor = {
  id: 'vendor-1',
  weddingId: 'wedding-1',
  category: VendorCategory.CATERING,
  name: 'Dragonfire Catering',
  location: 'Spokane',
  website: 'https://dragonfire.example.com',
  instagram: null,
  status: VendorStatus.IN_REVIEW,
  contactName: 'Dana Dragon',
  contactEmail: null,
  contactPhone: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  quotes: [
    {
      id: 'quote-1',
      vendorId: 'vendor-1',
      price: 4200,
      quoteType: QuoteType.FLAT_FEE,
      quoteDate: new Date('2026-02-01T00:00:00.000Z'),
      notes: 'Includes tasting',
      files: [
        {
          id: 'file-1',
          quoteId: 'quote-1',
          name: 'proposal.pdf',
          url: 'https://example.com/proposal.pdf',
          key: 'k1',
          size: 2048,
        },
      ],
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      updatedAt: new Date('2026-02-01T00:00:00.000Z'),
    },
  ],
  images: [],
  ratingSummary: { average: null, ratings: [], currentUserRating: null },
  contacted: true,
  notes: 'Strong tasting menu.',
  customFields: { guest_minimum: '80' },
}

function renderPanel(canEditPlanning: boolean, override: Partial<typeof vendor> = {}) {
  return render(
    <WorkspaceCapabilitiesProvider canEditPlanning={canEditPlanning}>
      <VendorDetailPanel
        // biome-ignore lint/suspicious/noExplicitAny: partial fixture
        vendor={{ ...vendor, ...override } as any}
        currency='USD'
        onClose={jest.fn()}
      />
    </WorkspaceCapabilitiesProvider>
  )
}

describe('VendorDetailPanel for viewers', () => {
  it('hides every write control but keeps data visible', () => {
    renderPanel(false)

    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add quote/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^remove$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove proposal/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /attach files/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /rate \d star/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/scratchpad notes/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/add interaction note/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /save custom fields/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/guest minimum/i)).not.toBeInTheDocument()

    expect(screen.getByText('Dragonfire Catering')).toBeInTheDocument()
    expect(screen.getByText('Spokane')).toBeInTheDocument()
    expect(screen.getByText('Strong tasting menu.')).toBeInTheDocument()
    expect(screen.getByText('Reached out over email')).toBeInTheDocument()
    expect(screen.getByText('Guest Minimum')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('$4,200')).toBeInTheDocument()
    expect(screen.getByText('Includes tasting')).toBeInTheDocument()
    expect(screen.getByText('Contacted')).toBeInTheDocument()
  })

  it('still opens attached PDFs in the viewer', () => {
    renderPanel(false)

    fireEvent.click(screen.getByRole('button', { name: 'proposal.pdf' }))

    expect(screen.getByTestId('file-viewer')).toHaveTextContent('proposal.pdf')
  })

  it('omits the scratchpad section when there are no notes', () => {
    renderPanel(false, { notes: null })

    expect(screen.queryByText('Scratchpad')).not.toBeInTheDocument()
  })
})

describe('VendorDetailPanel for editors', () => {
  it('shows the write controls', () => {
    renderPanel(true)

    expect(screen.getAllByRole('button', { name: /^edit$/i })).toHaveLength(2)
    expect(screen.getByRole('button', { name: /add quote/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^remove$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove proposal/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /attach files/i })).toBeInTheDocument()
    expect(screen.getByRole('switch')).toBeInTheDocument()
    expect(screen.getByLabelText(/scratchpad notes/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/add interaction note/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save custom fields/i })).toBeInTheDocument()
  })
})
