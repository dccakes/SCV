import { render, screen, fireEvent } from '@testing-library/react'

import {
  FileViewerDrawer,
  getViewableFileType,
} from '~/components/vendor/file-viewer-drawer'

// ---------------------------------------------------------------------------
// getViewableFileType unit tests
// ---------------------------------------------------------------------------

describe('getViewableFileType', () => {
  it.each([
    ['quote.pdf', 'pdf'],
    ['QUOTE.PDF', 'pdf'],
    ['photo.jpg', 'image'],
    ['photo.jpeg', 'image'],
    ['photo.PNG', 'image'],
    ['photo.webp', 'image'],
    ['photo.gif', 'image'],
  ])('returns correct type for %s', (name, expected) => {
    expect(getViewableFileType(name)).toBe(expected)
  })

  it.each([['contract.docx'], ['budget.xlsx'], ['notes.txt'], ['archive.zip']])(
    'returns null for unsupported format %s',
    (name) => {
      expect(getViewableFileType(name)).toBeNull()
    }
  )
})

// ---------------------------------------------------------------------------
// FileViewerDrawer render tests
// ---------------------------------------------------------------------------

describe('FileViewerDrawer', () => {
  it('renders nothing when file is null', () => {
    const { container } = render(<FileViewerDrawer file={null} onClose={jest.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the filename in the header for a PDF', () => {
    render(
      <FileViewerDrawer
        file={{ name: 'venue-quote.pdf', url: 'https://example.com/venue-quote.pdf' }}
        onClose={jest.fn()}
      />
    )
    expect(screen.getByText('venue-quote.pdf')).toBeInTheDocument()
  })

  it('shows "Document" label for a PDF', () => {
    render(
      <FileViewerDrawer
        file={{ name: 'quote.pdf', url: 'https://example.com/quote.pdf' }}
        onClose={jest.fn()}
      />
    )
    expect(screen.getByText('Document')).toBeInTheDocument()
  })

  it('renders an iframe for a PDF file', () => {
    render(
      <FileViewerDrawer
        file={{ name: 'quote.pdf', url: 'https://example.com/quote.pdf' }}
        onClose={jest.fn()}
      />
    )
    const iframe = screen.getByTitle('quote.pdf')
    expect(iframe.tagName).toBe('IFRAME')
    expect(iframe).toHaveAttribute('src', 'https://example.com/quote.pdf')
  })

  it('renders an img for an image file', () => {
    render(
      <FileViewerDrawer
        file={{ name: 'photo.jpg', url: 'https://example.com/photo.jpg' }}
        onClose={jest.fn()}
      />
    )
    const img = screen.getByRole('img', { name: 'photo.jpg' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('shows "Image" label for an image file', () => {
    render(
      <FileViewerDrawer
        file={{ name: 'photo.png', url: 'https://example.com/photo.png' }}
        onClose={jest.fn()}
      />
    )
    expect(screen.getByText('Image')).toBeInTheDocument()
  })

  it('does not render an iframe for an image file', () => {
    render(
      <FileViewerDrawer
        file={{ name: 'photo.jpg', url: 'https://example.com/photo.jpg' }}
        onClose={jest.fn()}
      />
    )
    expect(screen.queryByTitle('photo.jpg')).toBeNull()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn()
    render(
      <FileViewerDrawer
        file={{ name: 'quote.pdf', url: 'https://example.com/quote.pdf' }}
        onClose={onClose}
      />
    )
    fireEvent.click(screen.getByLabelText('Close file viewer'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
