import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TRPCClientError } from '@trpc/client'
import { toast } from 'sonner'
import { GuestExportMenu } from '~/components/guest-list/guest-export-menu'
import { downloadCsv } from '~/lib/download-csv'
import type { GuestExportData } from '~/lib/guest-export/guest-export-csv'

const mockFetch = jest.fn()

jest.mock('~/trpc/react', () => ({
  api: { useUtils: () => ({ guest: { getExportData: { fetch: mockFetch } } }) },
}))

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

jest.mock('~/lib/download-csv', () => {
  const actual = jest.requireActual('~/lib/download-csv')
  return { ...actual, downloadCsv: jest.fn(), localDateStamp: () => '2026-11-05' }
})

const mockDownloadCsv = downloadCsv as jest.Mock

const data: GuestExportData = {
  events: [{ id: 'reception', name: 'Reception', collectRsvp: true }],
  questions: [],
  households: [],
  guests: [
    {
      id: 1,
      householdId: 'h1',
      firstName: 'Ana',
      lastName: 'Ruiz',
      email: 'ana@example.com',
      phone: null,
      ageGroup: 'ADULT',
      isTagAlong: false,
      isPrimaryContact: true,
      tags: [],
    },
  ],
  invitations: [{ guestId: 1, eventId: 'reception', rsvp: 'Attending' }],
  answers: [],
}

const events = [{ id: 'reception', name: 'Réception' }]

const openMenu = () => {
  fireEvent.keyDown(screen.getByRole('button', { name: /Export/ }), { key: 'Enter' })
}

describe('GuestExportMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue(data)
  })

  it('exports every guest with fresh data and confirms the download', async () => {
    render(<GuestExportMenu events={events} guestCount={1} />)
    openMenu()
    fireEvent.click(await screen.findByRole('menuitem', { name: /All guests/ }))

    await waitFor(() => expect(mockDownloadCsv).toHaveBeenCalled())
    expect(mockFetch).toHaveBeenCalledWith(undefined, { staleTime: 0 })
    const [fileName, csv] = mockDownloadCsv.mock.calls[0]
    expect(fileName).toBe('guest-list-2026-11-05.csv')
    expect(csv.startsWith('First Name,Last Name,Household,Primary Contact')).toBe(true)
    expect(toast.success).toHaveBeenCalledWith('Downloaded guest-list-2026-11-05.csv', {
      description: '1 guest',
    })
  })

  it('exports one event without contact details', async () => {
    render(<GuestExportMenu events={events} guestCount={1} />)
    openMenu()
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Réception' }))

    await waitFor(() => expect(mockDownloadCsv).toHaveBeenCalled())
    const [fileName, csv] = mockDownloadCsv.mock.calls[0]
    expect(fileName).toBe('guests-reception-2026-11-05.csv')
    expect(csv).toContain('RSVP')
    expect(csv).not.toContain('Email')
    expect(csv).not.toContain('ana@example.com')
    expect(toast.success).toHaveBeenCalledWith('Downloaded guests-reception-2026-11-05.csv', {
      description: '1 invited guest, 1 attending',
    })
  })

  it('says the export ignores filters and counts every guest', async () => {
    render(<GuestExportMenu events={events} guestCount={14} />)
    openMenu()

    expect(await screen.findByText(/All 14 guests/)).toHaveTextContent('Filters are ignored')
  })

  it('hides the event section when there are no events', async () => {
    render(<GuestExportMenu events={[]} guestCount={1} />)
    openMenu()

    await screen.findByRole('menuitem', { name: /All guests/ })
    expect(screen.queryByText(/For one event/)).not.toBeInTheDocument()
  })

  it('is disabled when there are no guests yet', () => {
    render(<GuestExportMenu events={events} guestCount={0} />)

    expect(screen.getByRole('button', { name: /Export/ })).toBeDisabled()
  })

  it('explains a permission error and does not download', async () => {
    mockFetch.mockRejectedValue(
      new TRPCClientError('FORBIDDEN', {
        result: { error: { data: { code: 'FORBIDDEN' } } } as never,
      })
    )
    render(<GuestExportMenu events={events} guestCount={1} />)
    openMenu()
    fireEvent.click(await screen.findByRole('menuitem', { name: /All guests/ }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'You do not have permission to export the guest list.'
      )
    )
    expect(mockDownloadCsv).not.toHaveBeenCalled()
  })

  it('shows a retry message for other failures and re-enables the button', async () => {
    mockFetch.mockRejectedValue(new Error('network down'))
    render(<GuestExportMenu events={events} guestCount={1} />)
    openMenu()
    fireEvent.click(await screen.findByRole('menuitem', { name: /All guests/ }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Could not export the guest list. Please try again.')
    )
    expect(screen.getByRole('button', { name: /Export/ })).toBeEnabled()
  })

  it('disables the button while the export is running', async () => {
    let resolveFetch: (value: GuestExportData) => void = () => {}
    mockFetch.mockReturnValue(
      new Promise<GuestExportData>((resolve) => {
        resolveFetch = resolve
      })
    )
    render(<GuestExportMenu events={events} guestCount={1} />)
    openMenu()
    fireEvent.click(await screen.findByRole('menuitem', { name: /All guests/ }))

    const button = await screen.findByRole('button', { name: /Exporting/ })
    expect(button).toBeDisabled()

    await act(async () => resolveFetch(data))
    expect(screen.getByRole('button', { name: /Export/ })).toBeEnabled()
  })
})
