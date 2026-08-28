export const getPublicWebsiteBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const computePublicWebsiteUrl = (subUrl: string): string =>
  `${getPublicWebsiteBaseUrl()}/w/${subUrl}`
