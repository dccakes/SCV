import { render, screen } from '@testing-library/react'

import AuthenicatedLayout from '~/app/(authenicated)/layout'

jest.mock('~/components/layout/authenticated-layout-frame', () => ({
  AuthenticatedLayoutFrame: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='authenticated-layout-frame'>{children}</div>
  ),
}))

describe('AuthenicatedLayout', () => {
  it('should wrap children in the app sidebar shell', async () => {
    const element = await AuthenicatedLayout({ children: <div>Protected Page</div> })

    render(element)

    expect(screen.getByTestId('authenticated-layout-frame')).toBeInTheDocument()
    expect(screen.getByText('Protected Page')).toBeInTheDocument()
  })
})
