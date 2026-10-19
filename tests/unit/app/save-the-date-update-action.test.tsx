import type { ReactElement } from 'react'

const mockCookieGet = jest.fn()
const mockRedirect = jest.fn()
const mockGetInviteData = jest.fn()
const mockUpdateHouseholdDetails = jest.fn()

jest.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ get: mockCookieGet }),
}))

class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(`redirect:${url}`)
  }
}

jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    // Like Next's redirect, stop execution at the first call.
    throw new RedirectSignal(url)
  },
}))

jest.mock('~/server/application/household-invite', () => ({
  householdInviteService: {
    getInviteData: (...args: unknown[]) => mockGetInviteData(...args),
    updateHouseholdDetails: (...args: unknown[]) => mockUpdateHouseholdDetails(...args),
  },
}))

jest.mock('~/components/website/household-invite/household-details-form', () => ({
  HouseholdDetailsForm: () => null,
}))

jest.mock('~/components/website/household-invite/invalid-household-invite', () => ({
  InvalidHouseholdInvite: () => null,
}))

import {
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '~/server/domains/shared/domain-error'

type FormProps = { action: (formData: FormData) => Promise<void> }

async function getAction() {
  const Page = (await import('~/app/w/[websiteSubUrl]/save-the-date/update/page')).default
  const tree = (await Page({
    params: Promise.resolve({ websiteSubUrl: 'harry' }),
    searchParams: Promise.resolve({}),
  })) as ReactElement<{ children: ReactElement<{ children: ReactElement[] }> }>
  const section = tree.props.children
  const form = section.props.children.find(
    (child) => typeof (child?.props as Partial<FormProps>)?.action === 'function'
  ) as ReactElement<FormProps>
  return form.props.action
}

async function submitAndCaptureRedirect() {
  const action = await getAction()
  await action(new FormData()).catch((error: unknown) => {
    if (!(error instanceof RedirectSignal)) throw error
  })
  return mockRedirect.mock.calls[0]?.[0]
}

describe('save-the-date update action error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCookieGet.mockReturnValue({ value: 'code-1' })
    mockGetInviteData.mockResolvedValue({ household: {}, guests: [] })
  })

  it('redirects to error=expired when the invite no longer authorizes the household', async () => {
    mockUpdateHouseholdDetails.mockRejectedValue(new ForbiddenError('expired'))

    expect(await submitAndCaptureRedirect()).toBe('/w/harry/save-the-date/update?error=expired')
  })

  it.each([
    ['validation', new ValidationError('bad email')],
    ['conflict', new ConflictError('duplicate email')],
  ])('redirects to error=validation on a %s failure', async (_label, error) => {
    mockUpdateHouseholdDetails.mockRejectedValue(error)

    expect(await submitAndCaptureRedirect()).toBe('/w/harry/save-the-date/update?error=validation')
  })

  it('redirects to error=save on an unexpected failure', async () => {
    mockUpdateHouseholdDetails.mockRejectedValue(new Error('db down'))

    expect(await submitAndCaptureRedirect()).toBe('/w/harry/save-the-date/update?error=save')
  })

  it('redirects back to the save-the-date page on success', async () => {
    mockUpdateHouseholdDetails.mockResolvedValue(undefined)

    expect(await submitAndCaptureRedirect()).toBe('/w/harry/save-the-date?updated=1')
  })
})
