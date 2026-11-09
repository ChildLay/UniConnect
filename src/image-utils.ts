export function safePhotoUrl(value: string | null | undefined) {
  if (!value?.trim()) return undefined
  const localMedia = value.trim()
  if (/^\/api\/v1\/profiles\/[0-9a-f-]{36}\/media\/(profile|cover)\/[a-f0-9]{32}\.(jpg|png|webp)$/i.test(localMedia)) return localMedia
  try {
    const url = new URL(localMedia)
    if (url.protocol === 'https:' || url.protocol === 'blob:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) return url.href
  } catch {
    return undefined
  }
  return undefined
}

export function rememberBlockedUser(userId: string, name: string) {
  if (!name) return
  try {
    const saved = JSON.parse(localStorage.getItem('uniconnect.blocked-user-names') ?? '{}') as Record<string, string>
    saved[userId] = name
    localStorage.setItem('uniconnect.blocked-user-names', JSON.stringify(saved))
  } catch {
    // The backend still owns the block state if browser storage is unavailable.
  }
}

export function blockedUserName(userId: string) {
  try {
    const saved = JSON.parse(localStorage.getItem('uniconnect.blocked-user-names') ?? '{}') as Record<string, string>
    return saved[userId]
  } catch {
    return undefined
  }
}
