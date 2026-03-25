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

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

export function getViewableFileType(name: string): 'image' | 'pdf' | null {
  const lower = name.toLowerCase()
  if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return 'image'
  if (lower.endsWith('.pdf')) return 'pdf'
  return null
}

type FileViewerDrawerProps = {
  file: { name: string; url: string } | null
  onClose: () => void
}

export function FileViewerDrawer({ file, onClose }: FileViewerDrawerProps) {
  const fileType = file ? getViewableFileType(file.name) : null

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className={SIDE_PANE_OVERLAY_CLASS} />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-0 z-[60] flex h-screen w-screen max-w-none flex-col overflow-hidden p-0 outline-none',
            'md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-[680px] md:max-w-[680px]',
            SIDE_PANE_SURFACE_CLASS
          )}
        >
          <DialogTitle className='sr-only'>{file?.name ?? 'File Viewer'}</DialogTitle>
          <DialogDescription className='sr-only'>File viewer</DialogDescription>

          <DialogClose
            aria-label='Close file viewer'
            className='absolute top-4 right-4 z-10 rounded-full border border-border/80 bg-card p-1.5 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          >
            <X className='h-4 w-4' aria-hidden='true' />
          </DialogClose>

          {/* Header */}
          <header className='border-border/80 border-b px-5 py-5 pr-14'>
            <p className='font-mono text-[0.58rem] text-muted-foreground uppercase tracking-widest'>
              {fileType === 'image' ? 'Image' : 'Document'}
            </p>
            <h2 className='mt-0.5 truncate font-display text-xl text-foreground italic'>
              {file?.name}
            </h2>
          </header>

          {/* File content */}
          <div className='flex min-h-0 flex-1 items-center justify-center overflow-auto bg-muted/30'>
            {file && fileType === 'image' && (
              <img
                key={file.url}
                src={file.url}
                alt={file.name}
                className='max-h-full max-w-full object-contain p-4'
              />
            )}
            {file && fileType === 'pdf' && (
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
