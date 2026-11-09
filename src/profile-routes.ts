type ProfileName = { userId: string; firstName: string; lastName: string }

type ProfileRouteIndex = {
  bySlug: Record<string, string>
  byUserId: Record<string, { slug: string; name: string }>
}

const storageKey = 'uniconnect.profile-routes'
const emptyIndex = (): ProfileRouteIndex => ({ bySlug: {}, byUserId: {} })

function readIndex(): ProfileRouteIndex {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as ProfileRouteIndex | null
    if (value?.bySlug && value?.byUserId) return value
  } catch {
    // Recover from unavailable or invalid local browser storage.
  }
  return emptyIndex()
}

function writeIndex(index: ProfileRouteIndex) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(index))
  } catch {
    // A profile can still be opened during the current navigation without storage.
  }
}

function baseSlug(profile: ProfileName) {
  return `${profile.firstName}-${profile.lastName}`
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'member'
}

export function profileSlug(profile: ProfileName) {
  const index = readIndex()
  const name = `${profile.firstName} ${profile.lastName}`.trim()
  const existing = index.byUserId[profile.userId]
  if (existing?.name === name) return existing.slug

  const base = baseSlug(profile)
  let slug = base
  let suffix = 2
  while (index.bySlug[slug] && index.bySlug[slug] !== profile.userId) {
    slug = `${base}-${suffix++}`
  }

  if (existing) delete index.bySlug[existing.slug]
  index.bySlug[slug] = profile.userId
  index.byUserId[profile.userId] = { slug, name }
  writeIndex(index)
  return slug
}

export function profilePath(profile: ProfileName) {
  return `/profile/${profileSlug(profile)}`
}

export function profileIdForSlug(slug: string) {
  return readIndex().bySlug[slug]
}
