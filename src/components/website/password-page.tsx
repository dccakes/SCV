'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { sharedStyles } from '~/app/utils/shared-styles'

type PasswordPageProps = {
  verifyWebsitePassword: (passwordInput: string) => Promise<boolean>
}

export default function PasswordPage({ verifyWebsitePassword }: PasswordPageProps) {
  const [passwordInput, setPasswordInput] = useState('')
  const [showError, setShowError] = useState(false)
  const router = useRouter()

  const verifyPassword = async () => {
    const isVerified = await verifyWebsitePassword(passwordInput)

    if (!isVerified) {
      setShowError(true)
      return
    }

    router.refresh()
  }

  return (
    <div className='flex h-screen w-screen items-center justify-center'>
      <div className='text-center'>
        <h1 className='mb-5 text-2xl'>Enter password to view this site</h1>
        <div className='flex gap-5'>
          <input
            type='password'
            value={passwordInput}
            placeholder='Password'
            className='rounded-full border-2 px-5 py-3'
            onChange={(e) => {
              setShowError(false)
              setPasswordInput(e.target.value)
            }}
          />
          <button
            type='button'
            className={`${sharedStyles.primaryButton()}`}
            onClick={() => void verifyPassword()}
          >
            SUBMIT
          </button>
        </div>
        {showError && <p className='mt-5'>Incorrect Password</p>}
      </div>
    </div>
  )
}
