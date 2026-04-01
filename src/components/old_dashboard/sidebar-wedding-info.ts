type WeddingInfoInput = {
  brideFirstName?: string | null
  groomFirstName?: string | null
  date?: {
    standardFormat?: string | null
  } | null
  location?: string | null
}

type SidebarWeddingInfo = {
  coupleName: string | undefined
  weddingDate: string | undefined
  weddingLocation: string | undefined
}

export function getSidebarWeddingInfo(weddingData?: WeddingInfoInput): SidebarWeddingInfo {
  const brideFirstName = weddingData?.brideFirstName?.trim() ?? ''
  const groomFirstName = weddingData?.groomFirstName?.trim() ?? ''
  const coupleName =
    brideFirstName && groomFirstName ? `${brideFirstName} & ${groomFirstName}` : undefined
  const weddingDate = weddingData?.date?.standardFormat?.trim() || undefined
  const weddingLocation = weddingData?.location?.trim() || undefined

  return {
    coupleName,
    weddingDate,
    weddingLocation,
  }
}
