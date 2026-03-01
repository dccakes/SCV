'use client'

import Link from 'next/link'
import { useState } from 'react'
import { type Dispatch, type SetStateAction } from 'react'
import { AiOutlineDown, AiOutlinePlusCircle } from 'react-icons/ai'
import { BsPencil, BsThreeDotsVertical } from 'react-icons/bs'
import { FaCog } from 'react-icons/fa'
import { IoIosArrowForward } from 'react-icons/io'
import { LiaEyeSlash } from 'react-icons/lia'

import { useToggleEditRsvpSettingsForm } from '~/app/_components/contexts/edit-rsvp-settings-form-context'
import { useOuterClick } from '~/app/_components/hooks'
import { sharedStyles } from '~/app/utils/shared-styles'

type PageSectionsTemplateProps = {
  title: string
  children?: React.ReactNode
  collapse: boolean
  setShowRsvpSettings?: Dispatch<SetStateAction<boolean>>
}

export default function PageSectionsTemplate({
  title,
  children,
  collapse,
  setShowRsvpSettings,
}: PageSectionsTemplateProps) {
  const [showSection, setShowSection] = useState(!collapse)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <section className="mb-6">
      <div className="w-full rounded-lg border bg-card shadow-sm">
        <div className="flex justify-between px-5 py-5">
          <div className="flex items-center">
            <button
              className="text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setShowSection((prev) => !prev)}
            >
              {showSection ? (
                <AiOutlineDown className="h-4 w-4" />
              ) : (
                <IoIosArrowForward className="h-4 w-4" />
              )}
            </button>
            <h2 className="ml-3 font-serif text-lg font-semibold">{title}</h2>
          </div>
          <div className="flex items-center">
            <Link href="/dashboard/preview">
              <button className="text-sm text-primary transition-colors hover:text-primary/80">
                Preview
              </button>
            </Link>
            {title !== 'Home' && (
              <div className="relative flex">
                <span className={`${sharedStyles.verticalDivider}`}>|</span>
                <BsThreeDotsVertical
                  size={20}
                  onClick={() => setShowMenu(true)}
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                />
                {showMenu && (
                  <EditSectionMenu
                    setShowMenu={setShowMenu}
                    isRsvpSection={title === 'RSVP'}
                    setShowRsvpSettings={setShowRsvpSettings}
                  />
                )}
              </div>
            )}
          </div>
        </div>
        {showSection && (
          <>
            {children}
            {title !== 'RSVP' && (
              <div className="border-t p-5">
                <div className="flex cursor-pointer items-center">
                  <AiOutlinePlusCircle size={20} className="text-primary" />
                  <p className="pl-2 text-sm text-primary">Add More to {title}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

type EditSectionMenuProps = {
  setShowMenu: Dispatch<SetStateAction<boolean>>
  isRsvpSection: boolean
  setShowRsvpSettings?: Dispatch<SetStateAction<boolean>>
}

const EditSectionMenu = ({
  setShowMenu,
  isRsvpSection,
  setShowRsvpSettings,
}: EditSectionMenuProps) => {
  const editSectionMenuRef = useOuterClick(() => setShowMenu(false))
  const toggleEditRsvpSettingsForm = useToggleEditRsvpSettingsForm()
  return (
    <div
      ref={editSectionMenuRef}
      className="absolute -left-32 top-9 z-20 flex w-48 flex-col rounded-md border bg-popover shadow-md"
    >
      {isRsvpSection ? (
        <>
          <div
            className="flex cursor-pointer items-center gap-3 border-b p-4 text-foreground transition-colors hover:bg-muted/50"
            onClick={() => setShowRsvpSettings?.(true)}
          >
            <BsPencil size={16} className="text-primary" />
            <p className="text-sm">Edit Form</p>
          </div>
          <div className="flex cursor-pointer items-center gap-3 border-b p-4 text-foreground transition-colors hover:bg-muted/50">
            <LiaEyeSlash size={16} className="text-primary" />
            <p className="text-sm">Hide Page</p>
          </div>
          <div
            className="flex cursor-pointer items-center gap-3 p-4 text-foreground transition-colors hover:bg-muted/50"
            onClick={toggleEditRsvpSettingsForm}
          >
            <FaCog size={16} className="text-primary" />
            <p className="text-sm">RSVP Settings</p>
          </div>
        </>
      ) : (
        <>
          <div className="flex cursor-pointer items-center gap-3 border-b p-4 text-foreground transition-colors hover:bg-muted/50">
            <LiaEyeSlash size={16} className="text-primary" />
            <p className="text-sm">Hide Page</p>
          </div>
          <div className="flex cursor-pointer items-center gap-3 p-4 text-foreground transition-colors hover:bg-muted/50">
            <BsPencil size={16} className="text-primary" />
            <p className="text-sm">Rename Page</p>
          </div>
        </>
      )}
    </div>
  )
}
