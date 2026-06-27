'use client'

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
    <main className='flex min-h-screen items-center justify-center px-6'>
      <form
        className='w-full max-w-md space-y-6 rounded-[8px] border border-border/80 bg-background p-6 text-center shadow-sm'
        onSubmit={(event) => void verifyPassword(event)}
      >
        <div className='space-y-2'>
          <h1 className='font-serif text-2xl text-foreground'>Enter Password to View This Site</h1>
          <p className='text-muted-foreground text-sm leading-6'>
            Enter the password shared by the couple to unlock this wedding website.
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

        <Button className='w-full' disabled={isSubmitting} type='submit'>
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
