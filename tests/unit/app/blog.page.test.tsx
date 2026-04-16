import { render, screen, within } from '@testing-library/react'

import BlogPage from '~/app/blog/page'

const mockGetAllPublishedPosts = jest.fn()
const mockGetAllTags = jest.fn()

jest.mock('~/lib/blog/posts', () => ({
  getAllPublishedPosts: (options?: { tag?: string }) => mockGetAllPublishedPosts(options),
  getAllTags: () => mockGetAllTags(),
}))

describe('/blog page', () => {
  beforeEach(() => {
    mockGetAllPublishedPosts.mockReset()
    mockGetAllTags.mockReset()

    mockGetAllTags.mockReturnValue(['changelog', 'launch'])
    mockGetAllPublishedPosts.mockImplementation(({ tag }: { tag?: string } = {}) => {
      const posts = [
        {
          slug: 'introducing-oswp',
          title: 'Introducing OSWP',
          description: 'Product intro',
          publishedAt: '2026-04-14',
          author: 'Team OSWP',
          tags: ['launch', 'changelog'],
          draft: false,
          body: 'hello world',
          readTimeMinutes: 3,
          ogImageUrl: '/blog/og-intro.jpg',
        },
      ]

      if (tag && tag.toLowerCase() === 'changelog') {
        return posts
      }
      if (tag) {
        return []
      }

      return posts
    })
  })

  it('renders heading and post cards with metadata labels', async () => {
    const page = await BlogPage({ searchParams: Promise.resolve({}) })
    render(page)

    expect(screen.getByRole('heading', { name: /oswp blog/i })).toBeInTheDocument()
    const card = screen.getByRole('article')
    expect(within(card).getByRole('link', { name: 'Introducing OSWP' })).toBeInTheDocument()
    expect(within(card).getByText(/min read/i)).toBeInTheDocument()
  })

  it('filters by searchParams.tag and keeps changelog route behavior', async () => {
    const page = await BlogPage({ searchParams: Promise.resolve({ tag: 'changelog' }) })
    render(page)

    expect(mockGetAllPublishedPosts).toHaveBeenCalledWith({ tag: 'changelog' })
    expect(screen.getByRole('link', { name: 'changelog' })).toHaveAttribute(
      'href',
      '/blog?tag=changelog'
    )
  })

  it('renders an empty state for unknown tags', async () => {
    const page = await BlogPage({ searchParams: Promise.resolve({ tag: 'unknown' }) })
    render(page)

    expect(screen.getByText(/no posts found/i)).toBeInTheDocument()
  })
})
