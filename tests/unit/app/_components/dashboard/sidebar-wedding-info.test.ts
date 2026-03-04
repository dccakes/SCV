import { getSidebarWeddingInfo } from '~/app/_components/dashboard/sidebar-wedding-info'

describe('getSidebarWeddingInfo', () => {
  it('returns formatted couple name and date when both first names are present', () => {
    const info = getSidebarWeddingInfo({
      brideFirstName: 'Holly',
      groomFirstName: 'Diego',
      date: { standardFormat: '17 May 2027' },
    })

    expect(info).toEqual({
      coupleName: 'Holly & Diego',
      weddingDate: '17 May 2027',
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
    })
  })

  it('handles null wedding data', () => {
    const info = getSidebarWeddingInfo(undefined)

    expect(info).toEqual({
      coupleName: undefined,
      weddingDate: undefined,
    })
  })
})
