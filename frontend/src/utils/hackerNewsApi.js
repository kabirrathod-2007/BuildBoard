/**
 * Hacker News Live API Client
 * 
 * Demonstrates consuming a real-world third-party REST API using the browser's native `fetch()` API.
 * Uses Algolia's official Hacker News Search API (completely public, CORS-friendly, zero API key required).
 */

const HN_BASE_URL = 'https://hn.algolia.com/api/v1'

/**
 * Fetch real-time tech discussions and builder pain points from Hacker News.
 *
 * @param {Object} options
 * @param {'ask_hn' | 'show_hn' | 'front_page'} [options.topic='ask_hn'] - Discussion category
 * @param {number} [options.limit=6] - Number of items to fetch
 * @param {string} [options.query=''] - Optional search query
 * @param {AbortSignal} [options.signal] - Optional AbortController signal for cleanup
 * @returns {Promise<Array>} Array of parsed discussions
 */
export async function fetchLiveMarketDiscussions({
  topic = 'ask_hn',
  limit = 6,
  query = '',
  signal,
} = {}) {
  // Construct dynamic URL based on chosen feed
  let endpoint
  if (topic === 'front_page') {
    endpoint = `${HN_BASE_URL}/search?tags=front_page&hitsPerPage=${limit}`
  } else if (query) {
    endpoint = `${HN_BASE_URL}/search?query=${encodeURIComponent(query)}&tags=${topic}&hitsPerPage=${limit}`
  } else {
    // search_by_date provides the freshest real-time posts
    endpoint = `${HN_BASE_URL}/search_by_date?tags=${topic}&hitsPerPage=${limit}`
  }

  // --- NATIVE FETCH API CALL ---
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    signal,
  })

  // Check HTTP response status
  if (!response.ok) {
    throw new Error(`Failed to fetch from Hacker News API (Status: ${response.status} ${response.statusText})`)
  }

  // Parse JSON response body
  const data = await response.json()

  // Normalize and sanitize API data for UI consumption
  return (data.hits || [])
    .filter((hit) => Boolean(hit.title))
    .map((hit) => ({
      id: hit.objectID,
      title: hit.title,
      author: hit.author || 'anonymous',
      points: Number(hit.points || 0),
      commentsCount: Number(hit.num_comments || 0),
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      hnDiscussionUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      createdAt: hit.created_at,
    }))
}
