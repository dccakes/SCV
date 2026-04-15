import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  getAllPublishedPosts,
  getAllPublishedSlugs,
  getAllTags,
  getPostBySlug,
} from '~/lib/blog/posts'

function createPostFile(baseDir: string, slug: string, frontmatter: string, body: string): void {
  writeFileSync(path.join(baseDir, `${slug}.mdx`), `---\n${frontmatter}\n---\n\n${body}\n`, 'utf8')
}

describe('blog post utilities', () => {
  let contentDir: string

  beforeEach(() => {
    const root = mkdtempSync(path.join(tmpdir(), 'oswp-blog-tests-'))
    contentDir = path.join(root, 'content/blog')
    mkdirSync(contentDir, { recursive: true })

    createPostFile(
      contentDir,
      'introducing-oswp',
      [
        'title: Introducing OSWP',
        'description: Product intro',
        'publishedAt: 2026-04-14',
        'author: Team OSWP',
        'tags:',
        '  - launch',
        '  - changelog',
        'coverImage: /blog/cover-intro.jpg',
        'ogImage: /blog/og-intro.jpg',
      ].join('\n'),
      'hello '.repeat(410)
    )

    createPostFile(
      contentDir,
      'release-0-3-0',
      [
        'title: Release 0.3.0',
        'description: Release notes',
        'publishedAt: 2026-04-06',
        'author: Team OSWP',
        'tags:',
        '  - changelog',
      ].join('\n'),
      'release note content'
    )

    createPostFile(
      contentDir,
      'draft-post',
      [
        'title: Draft Post',
        'description: Hidden draft',
        'publishedAt: 2026-04-20',
        'author: Team OSWP',
        'tags:',
        '  - internal',
        'draft: true',
      ].join('\n'),
      'draft content that should never ship'
    )
  })

  afterEach(() => {
    rmSync(path.resolve(contentDir, '../..'), { recursive: true, force: true })
  })

  it('parses required fields and excludes drafts in published lists', () => {
    const posts = getAllPublishedPosts({ contentDir })

    expect(posts).toHaveLength(2)
    expect(posts[0]).toMatchObject({
      slug: 'introducing-oswp',
      title: 'Introducing OSWP',
      author: 'Team OSWP',
      draft: false,
    })
    expect(posts.some((post) => post.slug === 'draft-post')).toBe(false)
  })

  it('sorts published posts newest first', () => {
    const slugs = getAllPublishedSlugs({ contentDir })
    expect(slugs).toEqual(['introducing-oswp', 'release-0-3-0'])
  })

  it('computes read time from body word count', () => {
    const post = getPostBySlug('introducing-oswp', { contentDir })

    expect(post).not.toBeNull()
    expect(post?.readTimeMinutes).toBe(3)
  })

  it('filters by tag case-insensitively', () => {
    const posts = getAllPublishedPosts({ contentDir, tag: 'CHANGELOG' })

    expect(posts.map((post) => post.slug)).toEqual(['introducing-oswp', 'release-0-3-0'])
    expect(getAllTags({ contentDir })).toEqual(['changelog', 'launch'])
  })

  it('applies og fallback chain: ogImage -> coverImage -> default', () => {
    const intro = getPostBySlug('introducing-oswp', { contentDir })
    const release = getPostBySlug('release-0-3-0', { contentDir })

    expect(intro?.ogImageUrl).toBe('/blog/og-intro.jpg')
    expect(release?.ogImageUrl).toBe('/og-default.jpg')
  })

  it('throws with filename context when frontmatter is invalid', () => {
    createPostFile(
      contentDir,
      'broken',
      [
        'title: Broken Post',
        'publishedAt: 2026-04-15',
        'author: Team OSWP',
        'tags:',
        '  - changelog',
      ].join('\n'),
      'missing description in frontmatter'
    )

    expect(() => getAllPublishedPosts({ contentDir })).toThrow(/broken\.mdx/)
    expect(() => getAllPublishedPosts({ contentDir })).toThrow(/description is required/)
  })
})
