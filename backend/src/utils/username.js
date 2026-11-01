/**
 * Username validation, normalization, and collision-free generation utility.
 */

export function slugifyDisplayName(displayName) {
  if (!displayName || typeof displayName !== 'string') return 'builder'
  const cleaned = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15)
  return cleaned || 'builder'
}

export function isValidUsername(username) {
  if (!username || typeof username !== 'string') return false
  // 3 to 30 characters: lowercase letters, digits, hyphens, and underscores
  return /^[a-z0-9_-]{3,30}$/.test(username.trim())
}

export async function isUsernameTaken(database, username, excludeUserId = null) {
  if (!username || typeof username !== 'string') return false
  const normalized = username.toLowerCase().trim()

  const query = `
    SELECT user_id FROM user_profiles
    WHERE LOWER(profile_data->>'$.username') = ?
      ${excludeUserId ? 'AND user_id != ?' : ''}
    LIMIT 1
  `
  const params = excludeUserId ? [normalized, Number(excludeUserId)] : [normalized]
  const [rows] = await database.execute(query, params)
  return rows.length > 0
}

export async function generateUniqueUsername(database, displayName, excludeUserId = null) {
  const base = slugifyDisplayName(displayName)
  let attempts = 0
  const maxAttempts = 100

  while (attempts < maxAttempts) {
    // Generate random 4-digit numeric suffix: 1000 - 9999
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const candidate = `${base}${randomSuffix}`

    const taken = await isUsernameTaken(database, candidate, excludeUserId)
    if (!taken) {
      return candidate
    }
    attempts++
  }

  // Fallback with timestamp slice if high collision
  return `${base}${Date.now().toString().slice(-6)}`
}

