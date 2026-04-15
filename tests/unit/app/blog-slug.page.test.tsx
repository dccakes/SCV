import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

import BlogPostPage, { generateMetadata, generateStaticParams } from '~/app/blog/[slug]/page'

const mockGetAllPublishedSlugs = jest.fn()
const mockGetPostBySlug = jest.fn()
const mockNotFound = jest.fn()

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}))

jest.mock('next-mdx-remote/rsc', () => ({
  MDXRemote: ({ source }: { source: string }) => <div>{source}</div>,
}))

jest.mock('~/lib/blog/posts', () => ({
  getAllPublishedSlugs: () => mockGetAllPublishedSlugs(),
  getPostBySlug: (slug: string) => mockGetPostBySlug(slug),
}))

describe('/blog/[slug] page', () => {
  beforeEach(() => {
    mockGetAllPublishedSlugs.mockReset()
    mockGetPostBySlug.mockReset()
    mockNotFound.mockReset()

    mockGetAllPublishedSlugs.mockReturnValue(['introducing-oswp'])
    mockGetPostBySlug.mockImplementation((slug: string) => {
      if (slug !== 'introducing-oswp') return null

      return {
        slug,
        title: 'Introducing OSWP',
        description: 'Product intro',
        publishedAt: '2026-04-14',
        author: 'Team OSWP',
        tags: ['changelog'],
        draft: false,
        body: '# Hello OSWP',
        readTimeMinutes: 3,
        ogImageUrl: '/blog/og-intro.jpg',
      }
    })
  })

  it('generateStaticParams returns published slugs only', async () => {
    await expect(generateStaticParams()).resolves.toEqual([{ slug: 'introducing-oswp' }])
  })

  it('calls notFound for missing slug', async () => {
    const page = await (
      BlogPostPage as (props: { params: Promise<{ slug: string }> }) => Promise<ReactNode>
    )({
      params: Promise.resolve({ slug: 'missing' }),
    })

    expect(mockNotFound).toHaveBeenCalledTimes(1)
    expect(page).toBeNull()
  })

  it('includes metadata fields with og and twitter image', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'introducing-oswp' }),
    })

    expect(metadata.title).toBe('Introducing OSWP')
    expect(metadata.description).toBe('Product intro')
    expect(metadata.openGraph?.images).toEqual(['/blog/og-intro.jpg'])
    expect(metadata.twitter?.images).toEqual(['/blog/og-intro.jpg'])
  })

  it('renders the post page body and CTA', async () => {
    const page = await BlogPostPage({ params: Promise.resolve({ slug: 'introducing-oswp' }) })
    render(page)

    expect(screen.getByRole('heading', { name: 'Introducing OSWP' })).toBeInTheDocument()
    expect(screen.getByText('# Hello OSWP')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /start planning with oswp/i })).toHaveAttribute(
      'href',
      '/auth/signin'
    )
  })
})
