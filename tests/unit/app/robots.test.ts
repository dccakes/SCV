import robots from '~/app/robots'

describe('robots route', () => {
  it('points to app sitemap', () => {
    const value = robots()

    expect(value.sitemap).toBe('http://localhost:3000/sitemap.xml')
    expect(value.rules).toEqual({
      userAgent: '*',
      allow: '/',
    })
  })
})
