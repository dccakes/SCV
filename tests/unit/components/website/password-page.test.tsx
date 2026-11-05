import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import PasswordPage from '~/components/website/password-page'

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }))

function submitPassword(verify: (password: string) => Promise<boolean>) {
  render(<PasswordPage verifyWebsitePassword={verify} />)
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'hunter2' } })
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Site' }))
}

describe('PasswordPage', () => {
  beforeEach(() => mockRefresh.mockClear())

  it('refreshes into the site when the password is right', async () => {
    submitPassword(jest.fn().mockResolvedValue(true))

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
  })

  it('says the password is wrong and lets the guest retry', async () => {
    submitPassword(jest.fn().mockResolvedValue(false))

    expect(await screen.findByText(/incorrect password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unlock Site' })).toBeEnabled()
  })

  it('tells the guest to wait, and frees the button, when the unlock call throws (rate limited)', async () => {
    submitPassword(jest.fn().mockRejectedValue(new Error('Too many requests')))

    expect(await screen.findByText(/lots of guests are unlocking at once/i)).toBeInTheDocument()
    expect(screen.queryByText(/incorrect password/i)).not.toBeInTheDocument()
    // Previously the button stayed on "Unlocking…" forever.
    expect(screen.getByRole('button', { name: 'Unlock Site' })).toBeEnabled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('clears the wait message as soon as the guest edits the password', async () => {
    submitPassword(jest.fn().mockRejectedValue(new Error('Too many requests')))
    await screen.findByText(/lots of guests are unlocking at once/i)

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'hunter3' } })

    expect(screen.queryByText(/lots of guests are unlocking at once/i)).not.toBeInTheDocument()
  })

  it('shows only the busy message, never both, after a wrong password then a blocked retry', async () => {
    const verify = jest.fn().mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('x'))
    render(<PasswordPage verifyWebsitePassword={verify} />)
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'nope' } })
    fireEvent.click(screen.getByRole('button', { name: 'Unlock Site' }))
    expect(await screen.findByText(/incorrect password/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Unlock Site' }))

    expect(await screen.findByText(/lots of guests are unlocking at once/i)).toBeInTheDocument()
    expect(screen.queryByText(/incorrect password/i)).not.toBeInTheDocument()
  })

  it('tells the guest roughly how long to wait', async () => {
    submitPassword(jest.fn().mockRejectedValue(new Error('Too many requests')))

    expect(await screen.findByText(/about a minute/i)).toBeInTheDocument()
  })

  it('points assistive technology at the busy message, not only at the wrong password one', async () => {
    submitPassword(jest.fn().mockRejectedValue(new Error('Too many requests')))
    await screen.findByText(/lots of guests are unlocking at once/i)

    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'aria-describedby',
      'website-password-error'
    )
  })
})
