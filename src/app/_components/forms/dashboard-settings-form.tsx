'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { type Dispatch, type SetStateAction } from 'react'
import { BsTrash3 } from 'react-icons/bs'
import { IoMdClose } from 'react-icons/io'

import EditUrlView from '~/app/_components/forms/website-settings/edit-url'
import SetPasswordView from '~/app/_components/forms/website-settings/set-password'
import SidePaneWrapper from '~/app/_components/forms/wrapper'
import { LoadingSpinner } from '~/app/_components/loaders'
import { sharedStyles } from '~/app/utils/shared-styles'
import { type Website } from '~/app/utils/shared-types'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { api } from '~/trpc/react'

type DashboardSettingsFormProps = {
  setShowWebsiteSettings: Dispatch<SetStateAction<boolean>>
  website: Website | null | undefined
}

export default function DashboardSettingsForm({
  setShowWebsiteSettings,
  website,
}: DashboardSettingsFormProps) {
  const [showPasswordView, setShowPasswordView] = useState<boolean>(false)
  const [showEditUrlView, setShowEditUrlView] = useState<boolean>(false)

  return (
    <SidePaneWrapper>
      {showPasswordView ? (
        <SetPasswordView
          setShowPasswordView={setShowPasswordView}
          password={website?.password ?? ''}
        />
      ) : showEditUrlView ? (
        <EditUrlView setShowEditUrlView={setShowEditUrlView} websiteUrl={website?.subUrl ?? ''} />
      ) : (
        <Main
          setShowWebsiteSettings={setShowWebsiteSettings}
          website={website}
          setShowPasswordView={setShowPasswordView}
          setShowEditUrlView={setShowEditUrlView}
        />
      )}
    </SidePaneWrapper>
  )
}

type MainProps = {
  website: Website | null | undefined
  setShowWebsiteSettings: Dispatch<SetStateAction<boolean>>
  setShowPasswordView: Dispatch<SetStateAction<boolean>>
  setShowEditUrlView: Dispatch<SetStateAction<boolean>>
}

const Main = ({
  website,
  setShowWebsiteSettings,
  setShowPasswordView,
  setShowEditUrlView,
}: MainProps) => {
  const router = useRouter()
  const [appearInSearchEngines, setAppearInSearchEngines] = useState<boolean>(false)

  const updateWebsite = api.website.update.useMutation({
    onSuccess: () => {
      setShowPasswordView(false)
      router.refresh()
    },
    onError: (err) => {
      if (err) window.alert(err)
      else window.alert('Failed to update website! Please try again later.')
    },
  })

  const handleChange = (checked: boolean) => {
    if (!website?.isPasswordEnabled) {
      setShowPasswordView(true)
    } else {
      updateWebsite.mutate({
        isPasswordEnabled: checked,
        password: '',
      })
    }
  }

  return (
    <>
      <div className="flex justify-between border-b px-8 py-5">
        <h1 className="text-2xl font-bold">Settings</h1>
        <span className="cursor-pointer" onClick={() => setShowWebsiteSettings(false)}>
          <IoMdClose size={25} />
        </span>
      </div>
      <div className="px-8 pb-5">
        <h2 className="my-4 text-2xl font-bold">Visibility</h2>
        <div className="flex items-center justify-between pb-3">
          <Label htmlFor="search-engine-toggle" className="text-md">
            Appear in Search Engines
          </Label>
          <Switch
            id="search-engine-toggle"
            checked={appearInSearchEngines}
            onClick={() => setAppearInSearchEngines((prev) => !prev)}
          />
        </div>
        <p className="font-thin">
          {appearInSearchEngines
            ? "A link to your site doesn't currently show up in search engine results. This could keep some guests from finding your site."
            : 'A link to your site currently appears in search engines. This way guests can find your site without needing to memorize your URL.'}
        </p>
      </div>
      <div className="px-8 pb-5">
        <h2 className="my-4 text-2xl font-bold">Privacy</h2>
        <div className="flex items-center justify-between pb-3">
          <Label htmlFor="password-toggle" className="text-md">
            Require a Password
          </Label>
          {updateWebsite.isPending ? (
            <LoadingSpinner size={20} />
          ) : (
            <Switch
              id="password-toggle"
              checked={website?.isPasswordEnabled}
              onClick={() => handleChange(!website?.isPasswordEnabled)}
            />
          )}
        </div>
        <p className="font-thin">
          {website?.isPasswordEnabled
            ? 'Guests will be asked to enter a password before they may view your site.'
            : 'Anyone with a link to your site may view it.'}
        </p>
        {website?.isPasswordEnabled && (
          <div className="pt-5">
            <div className="flex justify-between pb-2">
              <span>Guest Password</span>
              <button
                className={`text-${sharedStyles.primaryColor}`}
                onClick={() => setShowPasswordView(true)}
              >
                Edit Password
              </button>
            </div>
            <span className="font-thin">{website?.password}</span>
          </div>
        )}
      </div>
      <div className="px-8 pb-5">
        <div className="flex justify-between">
          <h2 className="my-4 text-2xl font-bold">Your URL</h2>
          <button
            className={`text-${sharedStyles.primaryColor}`}
            onClick={() => setShowEditUrlView(true)}
          >
            Edit URL
          </button>
        </div>
        <span>{website?.url}</span>
      </div>
      <div className="flex items-center justify-center border-b border-t py-10">
        <div className="flex gap-2">
          <BsTrash3 size={25} />
          <span className="text-lg underline">Deactivate your Wedding Website</span>
        </div>
      </div>
    </>
  )
}
