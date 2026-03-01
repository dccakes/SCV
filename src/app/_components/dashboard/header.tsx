import { type Dispatch, type SetStateAction } from 'react'
import { Copy, Pencil, ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { Button } from '~/components/ui/button'
import { useToast } from '~/components/ui/use-toast'

type DashboardHeaderProps = {
  websiteUrl: string | undefined
  setShowWebsiteSettings: Dispatch<SetStateAction<boolean>>
}

export default function DashboardHeader({
  websiteUrl,
  setShowWebsiteSettings,
}: DashboardHeaderProps) {
  const { toast } = useToast()
  return (
    <section className="py-8">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Your Website</h1>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
              <span className="font-mono text-sm text-muted-foreground">
                {websiteUrl ?? 'Set your website URL'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-primary"
                onClick={async () => {
                  await navigator.clipboard.writeText(websiteUrl ?? '')
                  toast({ description: 'Website link copied!' })
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-primary"
                onClick={() => setShowWebsiteSettings(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            Share your Website
          </Button>
          <Button size="sm" asChild>
            <Link
              href={websiteUrl ? `/${websiteUrl}` : '#'}
              target="_blank"
              className="flex items-center gap-1.5"
            >
              Preview Site
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
