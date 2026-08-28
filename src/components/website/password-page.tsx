'use client'

import { Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

type PasswordPageProps = {
  verifyWebsitePassword: (passwordInput: string) => Promise<boolean>
}

export default function PasswordPage({ verifyWebsitePassword }: PasswordPageProps) {
  const [passwordInput, setPasswordInput] = useState('')
  const [showError, setShowError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const verifyPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    const isVerified = await verifyWebsitePassword(passwordInput)

    if (!isVerified) {
      setShowError(true)
      setIsSubmitting(false)
      return
    }

    router.refresh()
  }

  return (
    <main className='relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 px-6 py-12'>
      {/* Soft, warm backdrop so the unlock card reads as the clear focal point. */}
      <div aria-hidden className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl' />
        <div className='absolute right-0 bottom-0 h-72 w-72 translate-x-1/4 rounded-full bg-accent/20 blur-3xl' />
      </div>

      <form
        className='w-full max-w-md space-y-6 rounded-2xl border border-border/70 bg-background/95 p-8 text-center shadow-2xl shadow-foreground/10 ring-1 ring-border/40 backdrop-blur-sm sm:p-10'
        onSubmit={(event) => void verifyPassword(event)}
      >
        {/* Slim accent band anchors the top of the card. */}
        <div
          aria-hidden
          className='-mx-8 -mt-8 mb-2 h-1.5 rounded-t-2xl bg-gradient-to-r from-primary via-accent to-primary sm:-mx-10 sm:-mt-10'
        />

        <div className='flex justify-center'>
          <span className='inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20'>
            <Lock aria-hidden className='h-6 w-6' />
          </span>
        </div>

        <div className='space-y-2'>
          <p className='font-mono text-[0.6rem] text-muted-foreground uppercase tracking-[0.28em]'>
            Private Wedding Website
          </p>
          <h1 className='font-serif text-2xl text-foreground sm:text-3xl'>
            This site is password protected
          </h1>
          <p className='text-muted-foreground text-sm leading-6'>
            Enter the password shared by the couple to unlock their wedding website.
          </p>
        </div>

        <div className='space-y-2 text-left'>
          <label
            className='font-mono text-[0.62rem] uppercase tracking-[0.18em]'
            htmlFor='website-password'
          >
            Password
          </label>
          <Input
            aria-describedby={showError ? 'website-password-error' : undefined}
            autoComplete='current-password'
            autoFocus
            id='website-password'
            name='password'
            onChange={(event) => {
              setShowError(false)
              setPasswordInput(event.target.value)
            }}
            placeholder='Enter password…'
            spellCheck={false}
            type='password'
            value={passwordInput}
          />
        </div>

        <Button className='w-full' disabled={isSubmitting} size='lg' type='submit'>
          {isSubmitting ? 'Unlocking…' : 'Unlock Site'}
        </Button>

        <p
          aria-live='polite'
          className='min-h-5 text-destructive text-sm'
          id='website-password-error'
        >
          {showError ? 'Incorrect password. Check the password and try again.' : null}
        </p>
      </form>
    </main>
  )
}
