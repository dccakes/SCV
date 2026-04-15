import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'

import { mdxComponents } from '~/lib/blog/mdx-components'
import { getAllPublishedSlugs, getPostBySlug } from '~/lib/blog/posts'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return getAllPublishedSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    return {
      title: 'Post Not Found',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const url = `${siteUrl}/blog/${post.slug}`

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.description,
      images: [post.ogImageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.ogImageUrl],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
    return null
  }

  return (
    <main className='mx-auto w-full max-w-3xl px-6 py-20 md:px-12'>
      <article>
        <p className='mb-3 font-mono text-[0.7rem] text-primary uppercase tracking-[0.12em]'>
          {post.tags.join(' · ')}
        </p>
        <h1 className='font-serif text-5xl tracking-tight'>{post.title}</h1>
        <p className='mt-4 text-muted-foreground'>{post.description}</p>
        <p className='mt-3 font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.08em]'>
          {post.author} · {post.readTimeMinutes} min read
        </p>

        <div className='prose prose-neutral dark:prose-invert mt-10 max-w-none'>
          <MDXRemote
            source={post.body}
            components={mdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </div>
      </article>

      <section className='mt-16 rounded-lg border border-border bg-muted/30 p-6'>
        <h2 className='font-serif text-2xl'>Plan your wedding with OSWP</h2>
        <p className='mt-2 text-muted-foreground'>
          Create your workspace, invite your partner, and let Etta help with the heavy lifting.
        </p>
        <Link
          href='/auth/signin'
          className='mt-5 inline-flex rounded bg-foreground px-4 py-2 font-mono text-[0.7rem] text-background uppercase tracking-[0.08em]'
        >
          Start planning with OSWP
        </Link>
      </section>
    </main>
  )
}
