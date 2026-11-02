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

