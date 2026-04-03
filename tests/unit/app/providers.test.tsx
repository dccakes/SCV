import { render, screen } from '@testing-library/react'

import { Providers } from '~/app/providers'

jest.mock('~/lib/auth-client', () => ({
  authClient: {},
}))

jest.mock('~/components/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockRefresh = jest.fn()
const mockAuthUIProvider = jest.fn(({ children }: { children?: React.ReactNode }) => (
  <div data-testid='auth-ui-provider'>{children}</div>
))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}))

jest.mock('@daveyplate/better-auth-ui', () => ({
  AuthUIProvider: (props: Record<string, unknown>) => mockAuthUIProvider(props),
}))

describe('Providers', () => {
  beforeEach(() => {
    mockAuthUIProvider.mockClear()
    mockPush.mockReset()
    mockReplace.mockReset()
    mockRefresh.mockReset()
  })

  it('passes custom organization role labels to AuthUIProvider', () => {
    render(
      <Providers>
        <div>Child content</div>
      </Providers>
    )

    expect(screen.getByText('Child content')).toBeInTheDocument()
    expect(mockAuthUIProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        emailOTP: true,
        organization: {
          customRoles: [
            { role: 'member', label: 'Member' },
            { role: 'viewer', label: 'Viewer' },
          ],
        },
      })
    )
  })
})
