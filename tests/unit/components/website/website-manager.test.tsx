import { fireEvent, render, screen } from '@testing-library/react'

import { WebsiteManager } from '~/components/website-manager/website-manager'
import type { Website } from '~/server/domains/website/website.types'

const mockCreateMutate = jest.fn()
let mockWebsite: Website | null = null

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({
      website: {
        getByUserId: {
          invalidate: jest.fn(),
        },
      },
    }),
    website: {
      getByUserId: {
        useQuery: () => ({ data: mockWebsite }),
      },
      create: {
        useMutation: () => ({
          mutate: (...args: unknown[]) => mockCreateMutate(...args),
          isPending: false,
        }),
      },
    },
  },
}))

const buildWebsite = (overrides: Partial<Website> = {}): Website => ({
  id: 'website-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  weddingId: 'wedding-1',
  url: 'oswp.carvallo.io/janeandjohn',
  subUrl: 'janeandjohn',
  isPasswordEnabled: false,
  password: null,
  isRsvpEnabled: true,
  coverPhotoUrl: null,
  ...overrides,
})

describe('WebsiteManager', () => {
  beforeEach(() => {
    mockCreateMutate.mockReset()
    mockWebsite = null
  })

  it('shows a publish button and pre-filled slug when no website exists', () => {
    render(
      <WebsiteManager
        initialWebsite={null}
        userEmail='couple@example.com'
        defaultSubUrl='janeandjohn'
      />
    )

    expect(screen.getByText('Not published')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /publish website/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/website address/i)).toHaveValue('janeandjohn')
  })

  it('publishes with the default slug, host, and user email', () => {
    render(
      <WebsiteManager
        initialWebsite={null}
        userEmail='couple@example.com'
        defaultSubUrl='janeandjohn'
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /publish website/i }))

    expect(mockCreateMutate).toHaveBeenCalledTimes(1)
    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'couple@example.com', subUrl: 'janeandjohn' })
    )
  })

  it('publishes with an edited custom slug', () => {
    render(
      <WebsiteManager
        initialWebsite={null}
        userEmail='couple@example.com'
        defaultSubUrl='janeandjohn'
      />
    )

    fireEvent.change(screen.getByLabelText(/website address/i), {
      target: { value: 'ourbigday' },
    })
    fireEvent.click(screen.getByRole('button', { name: /publish website/i }))

    expect(mockCreateMutate).toHaveBeenCalledWith(expect.objectContaining({ subUrl: 'ourbigday' }))
  })

  it('publishes with a dashed custom slug', () => {
    render(
      <WebsiteManager
        initialWebsite={null}
        userEmail='couple@example.com'
        defaultSubUrl='janeandjohn'
      />
    )

    fireEvent.change(screen.getByLabelText(/website address/i), {
      target: { value: 'jane-and-john' },
    })
    fireEvent.click(screen.getByRole('button', { name: /publish website/i }))

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ subUrl: 'jane-and-john' })
    )
  })

  it('disables publishing and shows a prominent error when the slug is invalid', () => {
    render(
      <WebsiteManager
        initialWebsite={null}
        userEmail='couple@example.com'
        defaultSubUrl='janeandjohn'
      />
    )

    fireEvent.change(screen.getByLabelText(/website address/i), {
      target: { value: 'jane & john' },
    })

    expect(screen.getByRole('alert')).toHaveTextContent(/letters, numbers, dashes/i)
    expect(screen.getByRole('button', { name: /publish website/i })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /publish website/i }))
    expect(mockCreateMutate).not.toHaveBeenCalled()
  })

  it('shows the live url and view link when a website is published', () => {
    mockWebsite = buildWebsite()
    render(
      <WebsiteManager
        initialWebsite={mockWebsite}
        userEmail='couple@example.com'
        defaultSubUrl='janeandjohn'
      />
    )

    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText(/\/janeandjohn$/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view site/i })).toHaveAttribute(
      'href',
      expect.stringContaining('/janeandjohn')
    )
  })
})
