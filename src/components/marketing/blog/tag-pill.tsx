import Link from 'next/link'

type TagPillProps = {
  tag: string
  selected?: boolean
}

export default function TagPill({ tag, selected = false }: TagPillProps) {
  return (
    <Link
      href={`/blog?tag=${encodeURIComponent(tag)}`}
      className={`inline-flex rounded-full border px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.08em] transition-colors ${
        selected
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-background text-muted-foreground hover:text-foreground'
      }`}
    >
      {tag}
    </Link>
  )
}
