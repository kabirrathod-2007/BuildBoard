import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Radio,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  Rocket,
  TrendingUp,
  Clock,
  User,
  MessageSquare,
  ExternalLink,
} from 'lucide-react'
import { fetchLiveMarketDiscussions } from '../utils/hackerNewsApi.js'

function formatTimeAgo(isoString) {
  if (!isoString) return ''
  const past = new Date(isoString).getTime()
  const now = Date.now()
  const diffMinutes = Math.floor((now - past) / (1000 * 60))

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export default function LiveMarketRadar() {
  const [topic, setTopic] = useState('ask_hn')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    async function executeFetch() {
      try {
        const data = await fetchLiveMarketDiscussions({
          topic,
          limit: 6,
          signal: controller.signal,
        })
        if (!ignore) {
          setItems(data)
          setLastUpdated(new Date())
          setError(null)
        }
      } catch (err) {
        if (!ignore && err.name !== 'AbortError') {
          setError(err.message || 'Failed to load live discussions from Hacker News.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
          setIsRefreshing(false)
        }
      }
    }

    executeFetch()

    return () => {
      ignore = true
      controller.abort()
    }
  }, [topic, refreshKey])

  const handleTopicChange = (newTopic) => {
    if (newTopic === topic) return
    setLoading(true)
    setTopic(newTopic)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <section 
      aria-labelledby="market-radar-heading"
      className="my-10 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-5 sm:p-7 shadow-warm-sm transition-all"
    >
      {/* Top Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-main)] pb-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#d96b43]/10 text-[#d96b43] dark:bg-[#d96b43]/20 shadow-warm-xs">
            <Radio className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2
                id="market-radar-heading"
                className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]"
              >
                Live Market Radar: Builder Discussions
              </h2>
            </div>
            <p className="mt-1.5 text-sm sm:text-base leading-relaxed text-[var(--text-muted)]">
              Real-time questions, pain points, and prototypes fetched from the <strong>Hacker News REST API</strong> to spark validation ideas.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            title="Fetch latest posts from API"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] px-4 py-2 text-xs sm:text-sm font-bold text-[var(--text-main)] transition hover:border-[#d96b43] hover:text-[#d96b43] disabled:opacity-50 cursor-pointer shadow-warm-xs"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#d96b43]' : ''}`}
              aria-hidden="true"
            />
            <span>{isRefreshing ? 'Fetching...' : 'Refresh Feed'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-expanded={!isCollapsed}
            className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] p-2 text-xs sm:text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer shadow-warm-xs transition"
            title={isCollapsed ? 'Expand Market Radar' : 'Collapse Market Radar'}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="pt-5">
          {/* Feed Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleTopicChange('ask_hn')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  topic === 'ask_hn'
                    ? 'bg-[#141b16] text-[#f4ede2] dark:bg-[#f3f4f0] dark:text-[#0b100c] shadow-warm-xs'
                    : 'border border-[var(--border-main)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
                }`}
              >
                <HelpCircle className="h-4 w-4 text-[#d96b43]" aria-hidden="true" />
                <span>Ask HN (User Pain Points)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTopicChange('show_hn')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  topic === 'show_hn'
                    ? 'bg-[#141b16] text-[#f4ede2] dark:bg-[#f3f4f0] dark:text-[#0b100c] shadow-warm-xs'
                    : 'border border-[var(--border-main)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
                }`}
              >
                <Rocket className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                <span>Show HN (New Prototypes)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTopicChange('front_page')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  topic === 'front_page'
                    ? 'bg-[#141b16] text-[#f4ede2] dark:bg-[#f3f4f0] dark:text-[#0b100c] shadow-warm-xs'
                    : 'border border-[var(--border-main)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
                }`}
              >
                <TrendingUp className="h-4 w-4 text-amber-500" aria-hidden="true" />
                <span>Top Front Page</span>
              </button>
            </div>

            {lastUpdated && (
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--text-subtle)]">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Last checked: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </span>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
              <div className="flex items-center justify-between gap-3">
                <span><strong>API Error:</strong> {error}</span>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="font-bold underline hover:text-rose-900 cursor-pointer"
                >
                  Retry Request
                </button>
              </div>
            </div>
          )}

          {/* Loading Skeleton State */}
          {loading && !error && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="animate-pulse flex flex-col justify-between rounded-2xl border border-[var(--border-main)] bg-[var(--bg-page)] p-5"
                >
                  <div>
                    <div className="h-5 w-5/6 rounded bg-[var(--border-main)] mb-2.5" />
                    <div className="h-5 w-3/5 rounded bg-[var(--border-main)] mb-4" />
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-24 rounded bg-[var(--border-main)]" />
                      <div className="h-4 w-4 rounded bg-[var(--border-main)]" />
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-[var(--border-main)] pt-3.5">
                    <div className="h-4 w-20 rounded bg-[var(--border-main)]" />
                    <div className="h-4 w-16 rounded bg-[var(--border-main)]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Success Loaded State - Upgraded Card Layout */}
          {!loading && !error && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.04 }}
                    className="group relative flex flex-col justify-between rounded-2xl border border-[var(--border-main)] bg-[var(--bg-page)] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#d96b43]/60 hover:shadow-warm-md"
                  >
                    <div>
                      {/* Post Title */}
                      <h3 className="font-display text-base sm:text-lg font-bold leading-snug tracking-tight text-[var(--text-main)] group-hover:text-[#d96b43] transition-colors line-clamp-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="focus:outline-none focus:underline"
                        >
                          {item.title}
                        </a>
                      </h3>

                      {/* Author Details & External Source */}
                      <div className="mt-3 flex items-center justify-between text-xs sm:text-sm text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-main)] text-[var(--text-subtle)]">
                            <User className="h-3 w-3" aria-hidden="true" />
                          </span>
                          <span className="font-medium text-[var(--text-main)]">@{item.author}</span>
                        </span>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--text-subtle)] hover:text-[var(--text-main)] transition"
                          title="Open original link"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </div>

                    {/* Bottom Action Footer with Comments (Left) and Time Ago (Right) */}
                    <div className="mt-5 flex items-center justify-between border-t border-[var(--border-main)] pt-3.5">
                      <a
                        href={item.hnDiscussionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-muted)] hover:text-[#d96b43] transition-colors"
                        title="View conversation on Hacker News"
                      >
                        <MessageSquare className="h-4 w-4" aria-hidden="true" />
                        <span>{item.commentsCount} {item.commentsCount === 1 ? 'comment' : 'comments'}</span>
                      </a>

                      <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-[var(--text-subtle)]">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{formatTimeAgo(item.createdAt)}</span>
                      </span>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
