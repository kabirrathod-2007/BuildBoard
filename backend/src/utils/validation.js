/**
 * Input validation and sanitization utilities for BuildBoard API.
 */

export function isValidHttpUrl(string) {
  if (!string || typeof string !== 'string') return false
  try {
    const parsed = new URL(string.trim())
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.href.length <= 500
  } catch {
    return false
  }
}

export function validateAllowedFields(body, allowedSet, contextName = 'request') {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return `Send a valid JSON object for ${contextName}.`
  }
  for (const key of Object.keys(body)) {
    if (!allowedSet.has(key)) {
      return `Field '${key}' is not permitted in ${contextName}.`
    }
  }
  return null
}

export function sanitizeStringArray(arr, maxItems = 30, maxLength = 100) {
  if (!Array.isArray(arr)) return []
  return [...new Set(
    arr
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && item.length <= maxLength)
  )].slice(0, maxItems)
}

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export const PROFILE_FIELDS = new Set([
  'displayName',
  'username',
  'participation',
  'experienceLevel',
  'interests',
  'roles',
  'industries',
  'technologies',
  'testingDevices',
  'feedbackFocus',
  'availability',
  'handle',
  'bio',
  'location',
  'website',
  'github',
  'twitter',
  'linkedin',
  'defaultLandingView',
  'reminderCadence',
  'notifyBuilderReplies',
  'notifyHelpfulNotes',
  'notifyWeeklyDigest',
  'soundEffects',
  'cardDensity',
])

export const IGNORED_METADATA_FIELDS = new Set([
  'email',
  'updatedAt',
  'createdAt',
  'isServerSynced',
  'id',
  'userId',
  'user_id',
])

export function validateProfile(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'Send a profile object.' }
  }

  for (const key of Object.keys(value)) {
    if (IGNORED_METADATA_FIELDS.has(key)) continue
    if (!PROFILE_FIELDS.has(key)) {
      return { error: `Field '${key}' is not allowed in profile.` }
    }
  }

  const profile = {}
  for (const [key, fieldValue] of Object.entries(value)) {
    if (IGNORED_METADATA_FIELDS.has(key)) continue

    if (['participation', 'interests', 'roles', 'industries', 'technologies', 'testingDevices', 'feedbackFocus'].includes(key)) {
      if (!Array.isArray(fieldValue) || fieldValue.length > 100 || fieldValue.some((item) => typeof item !== 'string' || item.length > 120)) {
        return { error: `${key} must be an array of up to 100 short text values.` }
      }
      profile[key] = [...new Set(fieldValue.map((item) => item.trim()).filter(Boolean))]
      continue
    }

    if (['notifyBuilderReplies', 'notifyHelpfulNotes', 'notifyWeeklyDigest', 'soundEffects'].includes(key)) {
      if (typeof fieldValue !== 'boolean') return { error: `${key} must be true or false.` }
      profile[key] = fieldValue
      continue
    }

    if (typeof fieldValue !== 'string' || fieldValue.length > 2000) {
      return { error: `${key} must be text with at most 2,000 characters.` }
    }
    profile[key] = fieldValue.trim()
  }

  return { profile }
}


