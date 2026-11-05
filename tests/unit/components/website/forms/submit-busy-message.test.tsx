import { render, screen } from '@testing-library/react'

import { SubmitBusyMessage } from '~/components/website/forms/submit-busy-message'

jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}))

describe('SubmitBusyMessage', () => {
  it('shows the translated message as an alert rather than the server English text', () => {
    render(<SubmitBusyMessage />)

    expect(screen.getByRole('alert')).toHaveTextContent('rsvp.submitTooManyRequests')
  })
})
