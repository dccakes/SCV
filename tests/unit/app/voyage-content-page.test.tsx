import { render, screen } from '@testing-library/react'
import Page, { generateMetadata } from '~/app/w/[websiteSubUrl]/[page]/page'

const mockLoad = jest.fn()
const mockGrant = jest.fn()
jest.mock('~/app/w/[websiteSubUrl]/_lib/load-visitor-wedding', () => ({
  loadVisitorWedding: (...args: unknown[]) => mockLoad(...args),
}))
jest.mock('~/app/w/[websiteSubUrl]/_lib/website-access', () => ({
  grantWebsiteAccess: (...args: unknown[]) => mockGrant(...args),
}))
jest.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND')
  },
}))
jest.mock('~/components/website/password-page', () => ({
  __esModule: true,
  default: () => <div>Password required</div>,
}))
jest.mock('~/templates', () => ({
  resolveTemplate: (id: string) => ({ id }),
  TemplateThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock('~/templates/voyage/components/content-page', () => ({
  VoyageContentPage: ({ page }: { page: string }) => <div>Page: {page}</div>,
}))

const ready = {
  status: 'ready',
  weddingData: {
    website: { templateId: 'voyage' },
    websiteBuilderEnabled: true,
    brideFirstName: 'Holly',
    groomFirstName: 'Diego',
  },
}
const params = (page = 'stay') => Promise.resolve({ websiteSubUrl: 'couple', page })

beforeEach(() => {
  mockLoad.mockResolvedValue({ loadResult: ready, inviteToken: 'recognized-invite' })
})

it('loads a deep-linked page through the shared visitor access gate', async () => {
  render(await Page({ params: params() }))
  expect(mockLoad).toHaveBeenCalledWith('couple')
  expect(screen.getByText('Page: stay')).toBeInTheDocument()
})
it('shows only the password gate when access is required', async () => {
  mockLoad.mockResolvedValue({ loadResult: { status: 'password-required' } })
  render(await Page({ params: params() }))
  expect(screen.getByText('Password required')).toBeInTheDocument()
  expect(screen.queryByText('Page: stay')).toBeNull()
  expect(await generateMetadata({ params: params() })).toEqual({ title: 'Wedding Website' })
})
it('rejects unknown page names before loading wedding data', async () => {
  await expect(Page({ params: params('unknown') })).rejects.toThrow('NOT_FOUND')
  expect(mockLoad).not.toHaveBeenCalled()
})
it.each(['classic', 'aurelia'])('does not expose Voyage pages for %s', async (templateId) => {
  mockLoad.mockResolvedValue({
    loadResult: { ...ready, weddingData: { ...ready.weddingData, website: { templateId } } },
  })
  await expect(Page({ params: params() })).rejects.toThrow('NOT_FOUND')
})
it('does not expose pages when the website builder is disabled', async () => {
  mockLoad.mockResolvedValue({
    loadResult: { ...ready, weddingData: { ...ready.weddingData, websiteBuilderEnabled: false } },
  })
  await expect(Page({ params: params() })).rejects.toThrow('NOT_FOUND')
})
it('returns not found for a missing wedding', async () => {
  mockLoad.mockResolvedValue({ loadResult: { status: 'not-found' } })
  await expect(Page({ params: params() })).rejects.toThrow('NOT_FOUND')
})
