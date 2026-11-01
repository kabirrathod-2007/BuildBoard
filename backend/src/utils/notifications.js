/**
 * Helper to record in-app notifications
 */
export async function createNotification(database, {
  userId,
  actorId = null,
  type,
  title,
  body,
  linkUrl,
}) {
  if (!userId || !type || !title || !linkUrl) return null
  // Do not notify a user about their own actions
  if (actorId && Number(userId) === Number(actorId)) return null

  try {
    const [result] = await database.execute(
      `INSERT INTO notifications (user_id, actor_id, type, title, body, link_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, actorId, type, title.slice(0, 255), (body || '').slice(0, 1000), linkUrl.slice(0, 500)],
    )
    return result.insertId
  } catch (err) {
    // If notifications table does not exist yet (pending migration), log and don't fail the primary action
    if (err.code !== 'ER_NO_SUCH_TABLE') {
      console.warn('[BuildBoard Notifications] Could not create notification:', err.message)
    }
    return null
  }
}
