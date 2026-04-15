export type BlogFrontmatter = {
  title: string
  description: string
  publishedAt: string
  author: string
  tags: string[]
  draft?: boolean
  coverImage?: string
  ogImage?: string
}

export type BlogPost = {
  slug: string
  title: string
  description: string
  publishedAt: string
  publishedDate: Date
  author: string
  tags: string[]
  draft: boolean
  coverImage?: string
  ogImage?: string
  body: string
  readTimeMinutes: number
}

export type BlogPostSummary = Omit<BlogPost, 'body' | 'publishedDate'> & {
  ogImageUrl: string
}

export type BlogPostDetail = BlogPost & {
  ogImageUrl: string
}
