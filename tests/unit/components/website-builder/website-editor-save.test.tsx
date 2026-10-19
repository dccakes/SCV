import { act, fireEvent, render, screen } from '@testing-library/react'

import { WebsiteEditor } from '~/app/_components/website/website-editor'
import { EditingLanguageProvider } from '~/components/i18n/editing-language'

const mockMutate = jest.fn()

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))
jest.mock('~/trpc/react', () => ({
  api: {
    websiteSection: {
      updateHomeSection: {
        useMutation: () => ({ mutate: mockMutate, isPending: false }),
      },
    },
  },
}))

describe('WebsiteEditor save', () => {
  it('keeps edits typed while a save is in flight as unsaved', () => {
    render(
      <EditingLanguageProvider>
        <WebsiteEditor
          publicUrl='https://example.com/w/x'
          initialIntroText='Hello'
          initialHeadline=''
          initialHeadlineAccent=''
        />
      </EditingLanguageProvider>
    )
    const save = screen.getByRole('button', { name: 'Save' })

    fireEvent.change(screen.getByLabelText('Home Intro'), { target: { value: 'Welcome' } })
    fireEvent.click(save)
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ introText: 'Welcome' }),
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )

    // The couple keeps typing before the save finishes.
    fireEvent.change(screen.getByLabelText('Hero Headline'), { target: { value: 'New' } })
    act(() => mockMutate.mock.calls[0]?.[1].onSuccess())

    expect(save).toBeEnabled()
  })
})
