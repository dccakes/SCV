import { downloadCsv, localDateStamp, slugify } from '~/lib/download-csv'

const readBytes = (blob: Blob): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })

describe('downloadCsv', () => {
  const createObjectURL = jest.fn(() => 'blob:csv')
  const revokeObjectURL = jest.fn()
  let clickedDownload: string | undefined

  beforeEach(() => {
    jest.useFakeTimers()
    Object.assign(URL, { createObjectURL, revokeObjectURL })
    clickedDownload = undefined
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      clickedDownload = this.download
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
  })

  it('downloads the CSV with a UTF-8 byte order mark so Excel keeps accents', async () => {
    downloadCsv('guests.csv', 'Name\r\nJosé')

    const blob = (createObjectURL.mock.calls[0] as unknown as [Blob])[0]
    const bytes = await readBytes(blob)
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf])
    expect(new TextDecoder().decode(bytes.slice(3))).toBe('Name\r\nJosé')
    expect(clickedDownload).toBe('guests.csv')
  })

  it('revokes the object URL only after the click has been handled', () => {
    downloadCsv('guests.csv', 'Name')

    expect(revokeObjectURL).not.toHaveBeenCalled()
    jest.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv')
  })
})

describe('slugify', () => {
  it.each([
    ['Welcome Feast', 'welcome-feast'],
    ['Cérémonie', 'ceremonie'],
    ['José & Ana', 'jose-ana'],
  ])('turns %p into %p', (value, expected) => {
    expect(slugify(value)).toBe(expected)
  })

  it('uses the fallback when nothing usable is left', () => {
    expect(slugify('🎉', 'event')).toBe('event')
    expect(slugify('---')).toBe('export')
  })
})

describe('localDateStamp', () => {
  it('uses the local calendar date, padded', () => {
    expect(localDateStamp(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})
