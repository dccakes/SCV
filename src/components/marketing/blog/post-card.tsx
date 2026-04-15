import Link from 'next/link'

import type { BlogPostSummary } from '~/lib/blog/types'

type PostCardProps = {
  post: BlogPostSummary
}

function formatPublishedDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className='flex h-full flex-col rounded-lg border border-border bg-background p-6'>
      <div className='mb-4 flex items-center gap-2 text-[0.65rem] text-muted-foreground uppercase tracking-[0.08em]'>
        <span>{formatPublishedDate(post.publishedAt)}</span>
        <span aria-hidden='true'>·</span>
        <span>{post.readTimeMinutes} min read</span>
      </div>
      <h2 className='font-serif text-2xl leading-tight'>
        <Link href={`/blog/${post.slug}`} className='hover:text-primary'>
          {post.title}
        </Link>
      </h2>
      <p className='mt-3 flex-1 text-muted-foreground'>{post.description}</p>
      <div className='mt-5 flex flex-wrap gap-2'>
        {post.tags.map((tag) => (
          <span
            key={`${post.slug}-${tag}`}
            className='rounded bg-muted px-2 py-1 text-muted-foreground text-xs'
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  )
}
