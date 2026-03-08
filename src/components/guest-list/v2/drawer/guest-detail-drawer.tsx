'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type * as React from 'react'
import {
  SIDE_PANE_DIALOG_WIDTH_CLASS,
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

export type GuestDetailDrawerMode = 'desktop' | 'mobile'

export type GuestDetailDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  headerMeta?: React.ReactNode
  footer?: React.ReactNode
  mode?: GuestDetailDrawerMode
  className?: string
  children: React.ReactNode
}

export function GuestDetailDrawer(props: Readonly<GuestDetailDrawerProps>) {
  const {
    open,
    onOpenChange,
    title,
    subtitle,
    headerMeta,
    footer,
    mode = 'desktop',
    className,
    children,
  } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className={SIDE_PANE_OVERLAY_CLASS} />
        <DialogPrimitive.Content
          className={cn(
            `fixed inset-0 z-50 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden p-0 pb-0 outline-none ${SIDE_PANE_SURFACE_CLASS}`,
            mode === 'desktop' &&
              `md:inset-y-0 md:right-0 md:left-auto md:h-full md:translate-x-0 md:translate-y-0 md:p-6 ${SIDE_PANE_DIALOG_WIDTH_CLASS}`,
            className
          )}
        >
          <DialogClose
            aria-label='Close guest details'
            className='absolute top-4 right-4 z-10 rounded-full border border-border/80 bg-card p-1.5 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          >
            <X className='h-4 w-4' aria-hidden='true' />
          </DialogClose>

          <header className='border-border/80 border-b px-5 py-5 pr-14 md:px-6'>
            <DialogTitle className='font-serif text-3xl text-foreground leading-tight'>
              {title}
            </DialogTitle>
            {subtitle ? (
              <DialogDescription className='mt-1 text-sm'>{subtitle}</DialogDescription>
            ) : (
              <DialogDescription className='sr-only'>Guest details panel</DialogDescription>
            )}
            {headerMeta ? <div className='mt-3'>{headerMeta}</div> : null}
          </header>

          <div className='flex min-h-0 flex-1 flex-col'>
            <div className='flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 md:px-6'>
              {children}
            </div>
            {footer ? (
              <footer className='border-border/80 border-t px-5 py-4 md:px-6'>{footer}</footer>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
