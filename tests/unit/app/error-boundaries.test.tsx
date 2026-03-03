import { fireEvent, render, screen } from '@testing-library/react'

import AppErrorBoundary from '~/app/error'
import GlobalErrorBoundary from '~/app/global-error'

describe('App error boundary', () => {
  it('should render a recovery UI and allow retry', () => {
    const reset = jest.fn()

    render(<AppErrorBoundary error={new Error('Boom')} reset={reset} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(reset).toHaveBeenCalledTimes(1)
  })
})

describe('Global error boundary', () => {
  it('should render a fallback page with reload action', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<GlobalErrorBoundary error={new Error('Global Boom')} reset={jest.fn()} />)

    expect(screen.getByText('Unexpected application error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })
})
