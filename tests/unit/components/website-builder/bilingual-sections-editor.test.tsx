import { fireEvent, render, screen, within } from '@testing-library/react'

import { SectionsEditor } from '~/app/_components/website/sections-editor'
import { EditingLanguageProvider, EditingLanguageToggle } from '~/components/i18n/editing-language'
import type { WebsiteSection } from '~/server/domains/website-section/website-section.types'

const mockUpsertMutate = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

jest.mock('~/app/_components/website/image-upload', () => ({
  SingleImageUpload: () => <div>image upload</div>,
}))

jest.mock('~/trpc/react', () => ({
  api: {
    websiteSection: {
      upsertSection: {
        useMutation: () => ({ mutate: mockUpsertMutate, isPending: false }),
      },
    },
  },
}))

const faqSection = {
  id: 'faq',
  websiteId: 'w',
  type: 'FAQ',
  isEnabled: true,
  position: 7,
  content: {
    heading: 'FAQ',
    items: [
      { question: 'Dress code?', answer: 'Formal' },
      { question: 'Kids?', answer: 'Adults only' },
    ],
  },
  translations: {
    es: {
      heading: 'Preguntas frecuentes',
      items: [
        { question: '¿Código de vestimenta?', answer: '' },
        { question: '¿Niños?', answer: 'Solo adultos' },
      ],
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
} as WebsiteSection

function renderEditor() {
  render(
    <EditingLanguageProvider>
      <EditingLanguageToggle />
      <SectionsEditor initialSections={[faqSection]} />
    </EditingLanguageProvider>
  )
  const faqCard = screen.getByText('FAQ', { selector: 'p' }).closest('div.space-y-4') as HTMLElement
  return within(faqCard)
}

describe('bilingual sections editor', () => {
  beforeEach(() => mockUpsertMutate.mockReset())

  it('switches the boxes to the Spanish copy with the English as reference', () => {
    const card = renderEditor()
    expect(card.getByDisplayValue('FAQ')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Spanish' }))

    expect(card.getByDisplayValue('Preguntas frecuentes')).toBeInTheDocument()
    expect(card.getByDisplayValue('¿Niños?')).toBeInTheDocument()
    // Untranslated answer is blank, with the English shown as its placeholder.
    expect(card.getByPlaceholderText('Formal')).toHaveValue('')
    // Rows are managed in English only.
    expect(card.queryByRole('button', { name: 'Add question' })).not.toBeInTheDocument()
    expect(card.queryByRole('button', { name: 'Remove question' })).not.toBeInTheDocument()
  })

  it('saves Spanish edits as translations without touching the English content', () => {
    const card = renderEditor()
    fireEvent.click(screen.getByRole('radio', { name: 'Spanish' }))
    fireEvent.change(card.getByPlaceholderText('Formal'), { target: { value: 'Formal' } })
    fireEvent.click(card.getByRole('button', { name: 'Save' }))

    expect(mockUpsertMutate).toHaveBeenCalledWith({
      type: 'FAQ',
      isEnabled: true,
      content: faqSection.content,
      translations: {
        es: {
          heading: 'Preguntas frecuentes',
          items: [
            { question: '¿Código de vestimenta?', answer: 'Formal' },
            { question: '¿Niños?', answer: 'Solo adultos' },
          ],
        },
      },
    })
  })

  it('removes the matching Spanish row when an English row is deleted', () => {
    const card = renderEditor()
    fireEvent.click(card.getAllByRole('button', { name: 'Remove question' })[0] as HTMLElement)
    fireEvent.click(card.getByRole('button', { name: 'Save' }))

    expect(mockUpsertMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        content: { heading: 'FAQ', items: [{ question: 'Kids?', answer: 'Adults only' }] },
        translations: {
          es: {
            heading: 'Preguntas frecuentes',
            items: [{ question: '¿Niños?', answer: 'Solo adultos' }],
          },
        },
      })
    )
  })
})
