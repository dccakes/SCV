/**
 * Website Images Scraper - Jest Manual Mock
 *
 * Automatically used when jest.mock('~/server/infrastructure/scraper/website-images') is called.
 */

export const fetchWebsiteImages = jest.fn()

export const resetMocks = (): void => {
  fetchWebsiteImages.mockReset()
}
