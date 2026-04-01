import { getSidebarWeddingInfo } from '~/components/old_dashboard/sidebar-wedding-info'

describe('getSidebarWeddingInfo', () => {
  it('returns formatted couple name, date, and location when all present', () => {
    const info = getSidebarWeddingInfo({
      brideFirstName: 'Holly',
      groomFirstName: 'Diego',
      date: { standardFormat: '17 May 2027' },
      location: 'Oaxaca, Mexico',
    })

    expect(info).toEqual({
      coupleName: 'Holly & Diego',
      weddingDate: '17 May 2027',
      weddingLocation: 'Oaxaca, Mexico',
    })
  })

  it('returns undefined values when names are incomplete', () => {
    const info = getSidebarWeddingInfo({
      brideFirstName: 'Holly',
      groomFirstName: '',
      date: { standardFormat: '17 May 2027' },
    })

    expect(info).toEqual({
      coupleName: undefined,
      weddingDate: '17 May 2027',
      weddingLocation: undefined,
    })
  })

  it('handles null wedding data', () => {
    const info = getSidebarWeddingInfo(undefined)

    expect(info).toEqual({
      coupleName: undefined,
      weddingDate: undefined,
      weddingLocation: undefined,
    })
  })

  it('returns undefined location when location is null', () => {
    const info = getSidebarWeddingInfo({
      brideFirstName: 'Holly',
      groomFirstName: 'Diego',
      date: { standardFormat: '17 May 2027' },
      location: null,
    })

    expect(info).toEqual({
      coupleName: 'Holly & Diego',
      weddingDate: '17 May 2027',
      weddingLocation: undefined,
    })
  })

  it('trims whitespace from location', () => {
    const info = getSidebarWeddingInfo({
      brideFirstName: 'Holly',
      groomFirstName: 'Diego',
      date: { standardFormat: '17 May 2027' },
      location: '  Beach Resort  ',
    })

    expect(info).toEqual({
      coupleName: 'Holly & Diego',
      weddingDate: '17 May 2027',
      weddingLocation: 'Beach Resort',
    })
  })
})
