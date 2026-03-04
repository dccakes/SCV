import { render, screen } from '@testing-library/react'

import AuthenicatedLayout from '~/app/[authenicated]/layout'

jest.mock('~/app/_components/dashboard/app-layout-shell', () => ({
  AppLayoutShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='app-layout-shell'>{children}</div>
  ),
}))

describe('AuthenicatedLayout', () => {
  it('should wrap children in the app sidebar shell', async () => {
    const element = await AuthenicatedLayout({ children: <div>Protected Page</div> })

    render(element)

    expect(screen.getByTestId('app-layout-shell')).toBeInTheDocument()
    expect(screen.getByText('Protected Page')).toBeInTheDocument()
  })
})
