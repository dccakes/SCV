export function getUserFirstName(name?: string | null, email?: string | null): string | undefined {
  const trimmedName = name?.trim()
  if (trimmedName) {
    return trimmedName.split(/\s+/, 1)[0]
  }

  const localPart = email?.split('@')[0]?.trim()
  if (!localPart) {
    return undefined
  }

  return localPart.charAt(0).toUpperCase() + localPart.slice(1)
}

export function getUserInitials(name?: string | null, email?: string | null): string {
  const trimmedName = name?.trim()
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] ?? ''
    const second = parts[1]?.[0] ?? ''
    return `${first}${second || first}`.toUpperCase()
  }

  const localPart = email?.split('@')[0]?.trim()
  if (!localPart) {
    return 'U'
  }

  return localPart.slice(0, 2).toUpperCase()
}
