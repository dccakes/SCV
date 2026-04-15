import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import matter from 'gray-matter'

import type { BlogFrontmatter, BlogPost, BlogPostSummary } from '~/lib/blog/types'

const DEFAULT_OG_IMAGE = '/og-default.jpg'
const BLOG_DIR = path.join(process.cwd(), 'content/blog')

const wordsPerMinute = 200

function toSlug(filename: string): string {
  return filename.replace(/\.mdx?$/, '')
}

function getReadTimeMinutes(content: string): number {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

function validateFrontmatter(
  frontmatter: Record<string, unknown>,
  filePath: string
): BlogFrontmatter {
  const requiredString = (key: keyof BlogFrontmatter): string => {
    const value = frontmatter[key]
    if (value instanceof Date && key === 'publishedAt') {
      return value.toISOString()
    }
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Invalid frontmatter in ${filePath}: ${key} is required`)
    }

    return value.trim()
  }

  const tags = frontmatter.tags
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string' || !tag.trim())) {
    throw new Error(`Invalid frontmatter in ${filePath}: tags must be a non-empty string array`)
  }

  const draft = frontmatter.draft
  if (draft !== undefined && typeof draft !== 'boolean') {
    throw new Error(`Invalid frontmatter in ${filePath}: draft must be a boolean`)
  }

  const coverImage = frontmatter.coverImage
  if (coverImage !== undefined && typeof coverImage !== 'string') {
    throw new Error(`Invalid frontmatter in ${filePath}: coverImage must be a string`)
  }

  const ogImage = frontmatter.ogImage
  if (ogImage !== undefined && typeof ogImage !== 'string') {
    throw new Error(`Invalid frontmatter in ${filePath}: ogImage must be a string`)
  }

  return {
    title: requiredString('title'),
    description: requiredString('description'),
    publishedAt: requiredString('publishedAt'),
    author: requiredString('author'),
    tags: tags.map((tag) => tag.trim()),
    draft: draft ?? false,
    coverImage,
    ogImage,
  }
}

function parsePostFile(filePath: string): BlogPost {
  const fileContent = readFileSync(filePath, 'utf8')
  const { content, data } = matter(fileContent)
  const frontmatter = validateFrontmatter(data, filePath)
  const slug = toSlug(path.basename(filePath))
  const publishedDate = new Date(frontmatter.publishedAt)

  if (Number.isNaN(publishedDate.getTime())) {
    throw new Error(`Invalid frontmatter in ${filePath}: publishedAt must be a valid date string`)
  }

  return {
    slug,
    title: frontmatter.title,
    description: frontmatter.description,
    publishedAt: frontmatter.publishedAt,
    publishedDate,
    author: frontmatter.author,
    tags: frontmatter.tags,
    draft: frontmatter.draft ?? false,
    coverImage: frontmatter.coverImage,
    ogImage: frontmatter.ogImage,
    body: content,
    readTimeMinutes: getReadTimeMinutes(content),
  }
}

function getOgImageUrl(post: Pick<BlogPost, 'ogImage' | 'coverImage'>): string {
  return post.ogImage ?? post.coverImage ?? DEFAULT_OG_IMAGE
}

function readPostsDirectory(contentDir = BLOG_DIR): BlogPost[] {
  const files = readdirSync(contentDir).filter((file) => file.endsWith('.mdx'))
  return files.map((file) => parsePostFile(path.join(contentDir, file)))
}

export function getAllPublishedPosts(options?: {
  contentDir?: string
  tag?: string
}): BlogPostSummary[] {
  const tagFilter = options?.tag?.toLowerCase().trim()

  return readPostsDirectory(options?.contentDir)
    .filter((post) => !post.draft)
    .filter((post) => {
      if (!tagFilter) return true
      return post.tags.some((tag) => tag.toLowerCase() === tagFilter)
    })
    .sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime())
    .map(({ publishedDate: _publishedDate, ...post }) => ({
      ...post,
      ogImageUrl: getOgImageUrl(post),
    }))
}

export function getPostBySlug(
  slug: string,
  options?: { contentDir?: string }
): BlogPostSummary | null {
  const post = readPostsDirectory(options?.contentDir).find((entry) => entry.slug === slug)
  if (!post || post.draft) {
    return null
  }

  const { publishedDate: _publishedDate, ...rest } = post

  return {
    ...rest,
    ogImageUrl: getOgImageUrl(post),
  }
}

export function getAllPublishedSlugs(options?: { contentDir?: string }): string[] {
  return getAllPublishedPosts(options).map((post) => post.slug)
}

export function getAllTags(options?: { contentDir?: string }): string[] {
  return Array.from(
    new Set(
      getAllPublishedPosts(options)
        .flatMap((post) => post.tags)
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b))
}
