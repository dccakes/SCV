import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '~/../tests/unit/test-utils/intl'
import PasswordPage from '~/components/website/password-page'

describe('PasswordPage', () => {
  it('renders the English gate with a language toggle', () => {
    renderWithIntl(<PasswordPage verifyWebsitePassword={jest.fn()} />)

    expect(
      screen.getByRole('heading', { name: 'This site is password protected' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveAttribute('placeholder', 'Enter password…')
    expect(screen.getByRole('button', { name: 'Unlock Site' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cambiar a español' })).toBeInTheDocument()
  })

  it('renders every string in Spanish for Spanish-speaking visitors', async () => {
    const verify = jest.fn().mockResolvedValue(false)
    renderWithIntl(<PasswordPage verifyWebsitePassword={verify} />, { locale: 'es' })

    expect(screen.getByText('Sitio de boda privado')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Este sitio está protegido con contraseña' })
    ).toBeInTheDocument()
    const input = screen.getByLabelText('Contraseña')
    expect(input).toHaveAttribute('placeholder', 'Escribe la contraseña…')
    expect(screen.getByRole('button', { name: 'Switch to English' })).toHaveAttribute('lang', 'en')

    fireEvent.change(input, { target: { value: 'nope' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar al sitio' }))

    await waitFor(() =>
      expect(
        screen.getByText('Contraseña incorrecta. Revísala e intenta de nuevo.')
      ).toBeInTheDocument()
    )
    expect(verify).toHaveBeenCalledWith('nope')
  })
})
