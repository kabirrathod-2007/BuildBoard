/**
 * Generates personalized, friendly feedback reminder copy for enrolled testers.
 *
 * Rules:
 * 1. Personalization is strictly derived from the recorded enrollment date and the product's
 *    explicit feedback request or "what to try" fields.
 * 2. Never claims to know how long the user spent using the external product.
 * 3. When enrollment date is missing or invalid, no elapsed time is inferred.
 */

export function getFeedbackReminderInfo(enrollmentDate, product) {
  if (!product) return null

  // Focus context: builder's specific feedback request or first "what to try" prompt
  const feedbackRequest = product.feedbackRequest?.trim() || ''
  const firstWhatToTry =
    Array.isArray(product.whatToTry) && product.whatToTry[0]?.trim()
      ? product.whatToTry[0].trim()
      : ''
  const focusContext =
    feedbackRequest || firstWhatToTry || 'your experience trying this prototype'

  // Invalid or missing enrollment date: neutral copy without elapsed time
  if (!enrollmentDate) {
    return {
      title: 'Ready to share your impressions?',
      body: `Whenever you have had a chance to test this prototype, your feedback helps shape what comes next. The builder is especially looking for thoughts on: "${focusContext}".`,
      badge: 'Reminder',
      hasElapsed: false,
    }
  }

  const enrolledTime = new Date(enrollmentDate).getTime()
  if (isNaN(enrolledTime)) {
    return {
      title: 'Ready to share your impressions?',
      body: `Whenever you have had a chance to test this prototype, your feedback helps shape what comes next. The builder is especially looking for thoughts on: "${focusContext}".`,
      badge: 'Reminder',
      hasElapsed: false,
    }
  }

  const now = Date.now()
  const elapsedMs = Math.max(0, now - enrolledTime)
  const elapsedHours = elapsedMs / (1000 * 60 * 60)
  const elapsedDays = Math.floor(elapsedHours / 24)

  // Tier 1: Under 24 hours — Gentle invitation without urgency
  if (elapsedHours < 24) {
    return {
      title: 'Take your time exploring',
      body: `You enrolled recently — there's no rush! Explore the prototype at your own pace. Whenever you're ready, the builder would love your thoughts on: "${focusContext}".`,
      badge: 'Enrolled recently',
      hasElapsed: true,
      tier: 'recent',
    }
  }

  // Tier 2: 24 to 72 hours — Mention elapsed time and invite early impressions
  if (elapsedHours < 72) {
    const timePhrase = elapsedDays === 1 ? '1 day ago' : `${elapsedDays} days ago`
    return {
      title: `Enrolled ${timePhrase} — early impressions welcome`,
      body: `You enrolled ${timePhrase}. If you've had a chance to try it, even quick initial impressions help the builder. Consider sharing what felt intuitive or confusing about: "${focusContext}".`,
      badge: `Enrolled ${timePhrase}`,
      hasElapsed: true,
      tier: 'early',
    }
  }

  // Tier 3: 72 hours or more — Specific prompt about what worked or where they got stuck
  const timePhrase = `${elapsedDays} days ago`
  return {
    title: `Enrolled ${timePhrase} — what worked and where did you get stuck?`,
    body: `You enrolled ${timePhrase}. When trying this preview, did anything feel difficult or break? Specific observations on "${focusContext}" are especially valuable.`,
    badge: `Enrolled ${timePhrase}`,
    hasElapsed: true,
    tier: 'followup',
  }
}
