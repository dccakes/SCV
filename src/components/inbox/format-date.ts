export function formatMessageDate(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
      return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return String(date)
  }
}

export function formatMessageDateTime(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return String(date)
  }
}
