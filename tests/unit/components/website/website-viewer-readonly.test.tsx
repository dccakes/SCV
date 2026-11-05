import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'

import { RsvpToggleCard } from '~/app/_components/website/rsvp-toggle-card'
import { SectionsEditor } from '~/app/_components/website/sections-editor'
import { TemplatePicker } from '~/app/_components/website/template-picker'
import { WebsiteEditor } from '~/app/_components/website/website-editor'
import { WebsiteMediaEditor } from '~/app/_components/website/website-media-editor'
import { WebsitePasswordCard } from '~/app/_components/website/website-password-card'
import { WorkspaceCapabilitiesProvider } from '~/components/contexts/workspace-capabilities-context'
import EditUrlView from '~/components/forms/website-settings/edit-url'
import SetPasswordView from '~/components/forms/website-settings/set-password'
import { WebsiteManager } from '~/components/website-manager/website-manager'
import { listTemplateSummaries } from '~/templates/catalog'

const mutation = () => ({ mutate: jest.fn(), isPending: false })

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  // biome-ignore lint/performance/noImgElement: test stub
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

jest.mock('@vercel/blob/client', () => ({ upload: jest.fn() }))

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({ website: { getByUserId: { invalidate: jest.fn() } } }),
    website: {
      getByUserId: { useQuery: () => ({ data: null }) },
      create: { useMutation: () => mutation() },
      update: { useMutation: () => mutation() },
      updateIsRsvpEnabled: { useMutation: () => mutation() },
      updateTemplate: { useMutation: () => mutation() },
      updateHeaderImage: { useMutation: () => mutation() },
      updateCoupleImages: { useMutation: () => mutation() },
    },
    websiteSection: {
      updateHomeSection: { useMutation: () => mutation() },
      upsertSection: { useMutation: () => mutation() },
    },
  },
}))

const renderAs = (canEdit: boolean, ui: ReactElement) =>
  render(
    <WorkspaceCapabilitiesProvider canEditPlanning={canEdit}>{ui}</WorkspaceCapabilitiesProvider>
  )

describe.each([
  [true, 'editor'],
  [false, 'viewer'],
])('website controls for %s (%s)', (canEdit) => {
  const present = (el: HTMLElement | null) =>
    canEdit ? expect(el).toBeInTheDocument() : expect(el).not.toBeInTheDocument()

  it('RsvpToggleCard', () => {
    renderAs(canEdit, <RsvpToggleCard websiteId='w1' initialIsRsvpEnabled />)
    present(screen.queryByRole('switch'))
    expect(screen.getByText(/guests can submit rsvps/i)).toBeInTheDocument()
  })

  it('WebsitePasswordCard', () => {
    renderAs(canEdit, <WebsitePasswordCard initialIsPasswordEnabled />)
    present(screen.queryByRole('switch'))
    present(screen.queryByRole('button', { name: /save password/i }))
    if (!canEdit) {
      expect(screen.getByText(/password protected/i)).toBeInTheDocument()
    }
  })

  it('TemplatePicker', () => {
    const templates = listTemplateSummaries()
    renderAs(
      canEdit,
      <TemplatePicker templates={templates} currentTemplateId={templates[0]?.id ?? null} />
    )
    if (canEdit) {
      expect(screen.getAllByRole('button').length).toBe(templates.length)
    } else {
      expect(screen.queryAllByRole('button')).toHaveLength(0)
      expect(screen.getByText(templates[0]?.name ?? '')).toBeInTheDocument()
    }
  })

  it('WebsiteEditor', () => {
    renderAs(
      canEdit,
      <WebsiteEditor
        publicUrl='https://x.test/w/jj'
        initialIntroText='Hello'
        initialHeadline='Hi'
        initialHeadlineAccent='There'
      />
    )
    present(screen.queryByRole('button', { name: /^save$/i }))
    expect(screen.getByLabelText(/home intro/i)).toHaveValue('Hello')
    if (!canEdit) {
      expect(screen.getByLabelText(/home intro/i)).toHaveAttribute('readonly')
    }
    expect(screen.getByRole('link', { name: /open public site/i })).toBeInTheDocument()
  })

  it('WebsiteMediaEditor', () => {
    renderAs(
      canEdit,
      <WebsiteMediaEditor
        initialHeaderImageUrl='https://img.test/h.jpg'
        initialCoupleImageUrls={['https://img.test/a.jpg']}
      />
    )
    present(screen.queryByRole('button', { name: /save header/i }))
    present(screen.queryByRole('button', { name: /save photos/i }))
    present(screen.queryByRole('button', { name: /add photos/i }))
    present(screen.queryByRole('button', { name: /remove image/i }))
    present(screen.queryByRole('button', { name: /remove photo/i }))
    present(screen.queryByRole('button', { name: /replace image/i }))
  })

  it('SectionsEditor', () => {
    renderAs(canEdit, <SectionsEditor initialSections={[]} />)
    present(screen.queryAllByRole('switch')[0] ?? null)
    present(screen.queryAllByRole('button', { name: /^save$/i })[0] ?? null)
    if (!canEdit) {
      expect(screen.queryAllByRole('button')).toHaveLength(0)
    }
  })

  it('WebsiteManager when unpublished', () => {
    renderAs(canEdit, <WebsiteManager initialWebsite={null} userEmail='a@b.c' defaultSubUrl='jj' />)
    expect(screen.getByText('Not published')).toBeInTheDocument()
    present(screen.queryByRole('button', { name: /publish website/i }))
  })

  it('EditUrlView', () => {
    renderAs(canEdit, <EditUrlView setShowEditUrlView={jest.fn()} websiteUrl='jj' />)
    present(screen.queryByRole('button', { name: /^save$/i }))
  })

  it('SetPasswordView never reveals the password to viewers', () => {
    renderAs(canEdit, <SetPasswordView setShowPasswordView={jest.fn()} password='s3cret' />)
    present(screen.queryByRole('button', { name: /save changes/i }))
    if (!canEdit) {
      expect(screen.queryByDisplayValue('s3cret')).not.toBeInTheDocument()
      expect(screen.queryByText('s3cret')).not.toBeInTheDocument()
    }
  })
})
