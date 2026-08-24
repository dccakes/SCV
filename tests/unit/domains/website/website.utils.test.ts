describe('computeWebsiteUrl', () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://oswp.example'
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl
  })

  it('should compute the public website URL with the /w/ prefix', async () => {
    jest.resetModules()

    const { computeWebsiteUrl } = await import('~/server/domains/website/website.utils')

    expect(computeWebsiteUrl('johnandjane')).toBe('https://oswp.example/w/johnandjane')
  })

  it('should fall back to localhost when NEXT_PUBLIC_APP_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    jest.resetModules()

    const { computeWebsiteUrl } = await import('~/server/domains/website/website.utils')

    expect(computeWebsiteUrl('johnandjane')).toBe('http://localhost:3000/w/johnandjane')
  })
})
