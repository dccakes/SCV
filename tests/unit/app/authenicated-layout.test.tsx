import { render, screen } from '@testing-library/react'
import AuthenicatedLayout, * as AuthenticatedLayoutModule from '~/app/(authenicated)/layout'

const mockTrpcReactProvider = jest.fn(({ children }: { children: React.ReactNode }) => (
  <div data-testid='trpc-react-provider'>{children}</div>
))

const mockEventFormProvider = jest.fn(({ children }: { children: React.ReactNode }) => (
  <div data-testid='event-form-provider'>{children}</div>
))

const mockGuestFormProvider = jest.fn(({ children }: { children: React.ReactNode }) => (
  <div data-testid='guest-form-provider'>{children}</div>
))

const mockSonnerToaster = jest.fn(() => <div data-testid='auth-layout-sonner-toaster' />)

jest.mock('~/trpc/react', () => ({
  TRPCReactProvider: ({ children }: { children: React.ReactNode }) =>
    mockTrpcReactProvider({ children }),
}))

jest.mock('sonner', () => ({
  Toaster: () => mockSonnerToaster(),
}))

jest.mock('~/app/_components/contexts/event-form-context', () => ({
  EventFormProvider: ({ children }: { children: React.ReactNode }) =>
    mockEventFormProvider({ children }),
}))

jest.mock('~/app/_components/contexts/guest-form-context', () => ({
  GuestFormProvider: ({ children }: { children: React.ReactNode }) =>
    mockGuestFormProvider({ children }),
}))

jest.mock('~/components/layout/authenticated-layout-frame', () => ({
  AuthenticatedLayoutFrame: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='authenticated-layout-frame'>{children}</div>
  ),
}))

describe('AuthenicatedLayout', () => {
  beforeEach(() => {
    mockTrpcReactProvider.mockClear()
    mockSonnerToaster.mockClear()
    mockEventFormProvider.mockClear()
    mockGuestFormProvider.mockClear()
  })

  it('should wrap children in the app sidebar shell', async () => {
    const element = await AuthenicatedLayout({ children: <div>Protected Page</div> })

    render(element)

    expect(screen.getByTestId('authenticated-layout-frame')).toBeInTheDocument()
    expect(screen.getByText('Protected Page')).toBeInTheDocument()
  })

  it('should not add nested tRPC provider or duplicate sonner toaster', async () => {
    const element = await AuthenicatedLayout({ children: <div>Protected Page</div> })

    render(element)

    expect(mockTrpcReactProvider).not.toHaveBeenCalled()
    expect(mockSonnerToaster).not.toHaveBeenCalled()
    expect(screen.queryByTestId('trpc-react-provider')).not.toBeInTheDocument()
    expect(screen.queryByTestId('auth-layout-sonner-toaster')).not.toBeInTheDocument()
  })

  it('should force dynamic rendering for authenticated route group', () => {
    expect(AuthenticatedLayoutModule).toHaveProperty('dynamic', 'force-dynamic')
  })

  it('should scope guest and event form providers to authenticated routes', async () => {
    const element = await AuthenicatedLayout({ children: <div>Protected Page</div> })

    render(element)

    expect(mockEventFormProvider).toHaveBeenCalledTimes(1)
    expect(mockGuestFormProvider).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('event-form-provider')).toBeInTheDocument()
    expect(screen.getByTestId('guest-form-provider')).toBeInTheDocument()
  })
})
