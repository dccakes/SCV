import { render, screen } from '@testing-library/react'
import AuthenicatedLayout, * as AuthenticatedLayoutModule from '~/app/(authenicated)/layout'

const mockTrpcReactProvider = jest.fn(({ children }: { children: React.ReactNode }) => (
  <div data-testid='trpc-react-provider'>{children}</div>
))

const mockSonnerToaster = jest.fn(() => <div data-testid='auth-layout-sonner-toaster' />)

jest.mock('~/trpc/react', () => ({
  TRPCReactProvider: ({ children }: { children: React.ReactNode }) =>
    mockTrpcReactProvider({ children }),
}))

jest.mock('sonner', () => ({
  Toaster: () => mockSonnerToaster(),
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

  it('should not force dynamic rendering for entire authenticated route group', () => {
    expect(AuthenticatedLayoutModule).not.toHaveProperty('dynamic')
  })
})
