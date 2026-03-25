'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import {
  SIDE_PANE_OVERLAY_CLASS,
  SIDE_PANE_SURFACE_CLASS,
} from '~/components/layout/side-pane-styles'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '~/components/ui/dialog'
import { cn } from '~/lib/utils'

type PdfViewerDrawerProps = {
  file: { name: string; url: string } | null
  onClose: () => void
}

export function PdfViewerDrawer({ file, onClose }: PdfViewerDrawerProps) {
  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className={SIDE_PANE_OVERLAY_CLASS} />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-0 z-[60] flex h-screen w-screen max-w-none flex-col overflow-hidden p-0 outline-none',
            `md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-[680px] md:max-w-[680px]`,
            SIDE_PANE_SURFACE_CLASS
          )}
        >
          <DialogTitle className='sr-only'>{file?.name ?? 'PDF Viewer'}</DialogTitle>
          <DialogDescription className='sr-only'>PDF document viewer</DialogDescription>

          <DialogClose
            aria-label='Close PDF viewer'
            className='absolute top-4 right-4 z-10 rounded-full border border-border/80 bg-card p-1.5 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          >
            <X className='h-4 w-4' aria-hidden='true' />
          </DialogClose>

          {/* Header */}
          <header className='border-border/80 border-b px-5 py-5 pr-14'>
            <p className='font-mono text-[0.58rem] text-muted-foreground uppercase tracking-widest'>
              Document
            </p>
            <h2 className='mt-0.5 truncate font-display text-xl text-foreground italic'>
              {file?.name}
            </h2>
          </header>

          {/* PDF iframe */}
          <div className='flex min-h-0 flex-1'>
            {file && (
              <iframe
                key={file.url}
                src={file.url}
                title={file.name}
                className='h-full w-full border-0'
              />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
