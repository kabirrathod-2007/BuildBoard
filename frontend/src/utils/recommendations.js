/**
 * Deterministically match products against a user profile using explicit profile and product fields.
 * No AI inference or hidden scoring is used.
 */

function normalize(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

/**
 * Calculates matching recommendations for a given profile across products.
 *
 * @param {Array} products - List of products available in BuildBoard
 * @param {Object} profile - User's saved profile
 * @returns {Array} - Array of objects: { product, score, reasons: string[] }, sorted by highest score
 */
export function getRecommendedProducts(products = [], profile = null) {
  if (!profile || typeof profile !== 'object') {
    return []
  }

  const userInterests = (profile.interests || []).map(normalize).filter(Boolean)
  const userRoles = (profile.roles || []).map(normalize).filter(Boolean)
  const userIndustries = (profile.industries || []).map(normalize).filter(Boolean)
  const userTechnologies = (profile.technologies || []).map(normalize).filter(Boolean)

  // If user hasn't specified any targeting preferences yet, no recommendations are generated
  const explicitExpFieldExists = products.some(
    (p) => p && (p.targetExperience || p.targetExperienceLevels)
  )
  const hasValidExpTarget = Boolean(profile.experienceLevel && explicitExpFieldExists)

  if (
    userInterests.length === 0 &&
    userRoles.length === 0 &&
    userIndustries.length === 0 &&
    userTechnologies.length === 0 &&
    !hasValidExpTarget
  ) {
    return []
  }

  const matches = []

  for (const product of products) {
    if (!product) continue

    const reasons = []

    // 1. Category / Interest match (product.categories vs user profile.interests)
    if (Array.isArray(product.categories)) {
      for (const cat of product.categories) {
        if (userInterests.includes(normalize(cat))) {
          reasons.push(`Matches your ${cat} interest`)
        }
      }
    }

    // 2. Role match (product.targetRoles vs user profile.roles)
    if (Array.isArray(product.targetRoles)) {
      for (const role of product.targetRoles) {
        if (userRoles.includes(normalize(role))) {
          reasons.push(`Matches your ${role} role`)
        }
      }
    }

    // 3. Industry match (product.targetIndustries vs user profile.industries)
    if (Array.isArray(product.targetIndustries)) {
      for (const ind of product.targetIndustries) {
        if (userIndustries.includes(normalize(ind))) {
          reasons.push(`Matches your ${ind} industry`)
        }
      }
    }

    // 4. Technology match (product.targetTechnologies vs user profile.technologies)
    if (Array.isArray(product.targetTechnologies)) {
      for (const tech of product.targetTechnologies) {
        if (userTechnologies.includes(normalize(tech))) {
          reasons.push(`Relevant to your ${tech} experience`)
        }
      }
    }

    // 5. Experience level match (ONLY if product has an explicit target-experience field that builders can set)
    // Do not infer or match from free-text fields (e.g. audience, description, whatToTry).
    const explicitProductExp = product.targetExperience || product.targetExperienceLevels
    if (profile.experienceLevel && explicitProductExp) {
      const userExp = normalize(profile.experienceLevel)
      const expList = Array.isArray(explicitProductExp) ? explicitProductExp : [explicitProductExp]
      for (const exp of expList) {
        if (exp && normalize(exp) === userExp) {
          reasons.push(`Matches required experience: ${exp}`)
        }
      }
    }

    // Only include if there is at least one verified explicit match
    if (reasons.length > 0) {
      matches.push({
        product,
        score: reasons.length,
        reasons,
      })
    }
  }

  // Rank by number of matching criteria descending
  return matches.sort((a, b) => b.score - a.score)
}
