import type { Metadata } from 'next'
import Link from 'next/link'

import PostCard from '~/components/marketing/blog/post-card'
import TagPill from '~/components/marketing/blog/tag-pill'
import { getAllPublishedPosts, getAllTags } from '~/lib/blog/posts'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  title: 'OSWP Blog',
  description: 'Product updates, changelog entries, and planning insights from the OSWP team.',
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const { tag } = await searchParams
  const selectedTag = tag?.trim()
  const posts = getAllPublishedPosts({ tag: selectedTag })
  const tags = getAllTags()

  return (
    <main className='mx-auto w-full max-w-6xl px-6 py-20 md:px-12'>
      <header className='mb-10'>
        <p className='mb-3 font-mono text-[0.7rem] text-primary uppercase tracking-[0.12em]'>
          Marketing
        </p>
        <h1 className='font-serif text-5xl tracking-tight'>OSWP Blog</h1>
        <p className='mt-3 max-w-2xl text-muted-foreground'>
          Product updates, changelog entries, and stories from building the open source wedding
          platform.
        </p>
      </header>

      <section className='mb-8 flex flex-wrap items-center gap-2'>
        <Link
          href='/blog'
          className={`inline-flex rounded-full border px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.08em] ${
            selectedTag
              ? 'border-border text-muted-foreground hover:text-foreground'
              : 'border-foreground bg-foreground text-background'
          }`}
        >
          all
        </Link>
        {tags.map((entry) => (
          <TagPill
            key={entry}
            tag={entry}
            selected={selectedTag?.toLowerCase() === entry.toLowerCase()}
          />
        ))}
      </section>

      {posts.length > 0 ? (
        <section className='grid gap-6 md:grid-cols-2'>
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </section>
      ) : (
        <section className='rounded-lg border border-border border-dashed p-10 text-center'>
          <h2 className='font-serif text-2xl'>No posts found</h2>
          <p className='mt-2 text-muted-foreground'>Try a different tag or return to all posts.</p>
        </section>
      )}
    </main>
  )
}
