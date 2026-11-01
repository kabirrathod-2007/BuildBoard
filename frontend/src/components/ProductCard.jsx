import { Link } from 'react-router'
import { useIndexedDbMedia } from '../utils/indexedDB.js'
import { useDemoData } from '../context/DemoDataContext.jsx'

/**
 * BuildBoard Harmonized Product Card Component
 * Supports both horizontal feed row and grid card layouts.
 * Fully styled using Tailwind CSS v4 utilities, DM Sans headings,
 * sans-serif body, and warm paper/forest studio tokens.
 */
export default function ProductCard({
  product,
  variant = 'grid', // 'grid' | 'feed'
  isBestOfWeek = false,
  badgeText = '',
  className = '',
}) {
  const { url: mediaUrl } = useIndexedDbMedia(product?.mediaId, product?.image)
  const { getProfile } = useDemoData()

  if (!product) return null

  const id = product.id || product._id
  const title = product.name || product.title || 'Untitled Prototype'
  const tagline = product.tagline || ''
  const categories = product.categories || (product.category ? [product.category] : ['Developer Tools'])
  const image = mediaUrl || product.image
  const stage = product.stage || 'Working prototype'
  const enrollmentPaused = product.enrollmentPaused
  const isLocalDemo = product.isLocalDemo
  const creatorProfile = product.creatorEmail ? getProfile(product.creatorEmail) : null
  const authorName =
    creatorProfile?.displayName?.trim() ||
    product.maker ||
    (product.creatorEmail ? product.creatorEmail.split('@')[0] : 'Independent Builder')
  const initial = title.charAt(0).toUpperCase()

  if (variant === 'feed') {
    return (
      <article
        className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-warm-md ${className}`}
      >
        <div className="flex items-start gap-5 flex-1 min-w-0">
          {/* Product Icon / Initial Box */}
          {image ? (
            <img
              src={image}
              alt=""
              className="h-16 w-16 shrink-0 rounded-2xl object-cover object-top border border-[var(--border-main)] bg-[var(--bg-surface-subtle)]"
              loading="lazy"
            />
          ) : (
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] font-display text-2xl font-bold text-[var(--text-main)]"
              aria-hidden="true"
            >
              {initial}
            </div>
          )}

          {/* Product Info */}
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/products/${id}`}
                className="font-display text-xl font-bold text-[var(--text-main)] hover:text-[#d96b43] dark:hover:text-[#e07a5f] transition-colors truncate"
              >
                {title}
              </Link>
              {isBestOfWeek && (
                <span className="rounded-full border border-[#d96b43]/30 bg-[#fbf3ee] dark:bg-[#e07a5f]/15 px-3 py-0.5 text-sm font-semibold text-[#b85028] dark:text-[#eb8b72]">
                  {badgeText || 'Best of Week'}
                </span>
              )}
              {categories.slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-3 py-0.5 text-sm font-medium text-[var(--text-muted)]"
                >
                  {cat}
                </span>
              ))}
            </div>

            <p className="text-base text-[var(--text-muted)] line-clamp-2 leading-relaxed">
              {tagline}
            </p>

            {/* Author & Meta */}
            <div className="mt-1 flex flex-wrap items-center gap-2.5 text-sm text-[var(--text-subtle)]">
              <span className="font-medium text-[var(--text-muted)]">
                by {authorName}
              </span>
              <span aria-hidden="true">·</span>
              <span className="uppercase text-sm font-semibold text-[var(--text-subtle)]">
                {stage}
              </span>
              <span aria-hidden="true">·</span>
              {enrollmentPaused ? (
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  Enrollment paused
                </span>
              ) : (
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Open for testing
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="self-end sm:self-center shrink-0">
          <Link
            to={`/products/${id}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text-main)] shadow-warm-xs transition hover:border-[#d96b43] hover:text-[#d96b43] dark:hover:border-[#e07a5f] dark:hover:text-[#e07a5f]"
          >
            <span>View prototype</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </article>
    )
  }

  // Grid Card Variant (Default)
  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] shadow-warm-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#d96b43] dark:hover:border-[#e07a5f] hover:shadow-warm-md ${className}`}
    >
      {/* Thumbnail or Icon Banner */}
      <Link
        to={`/products/${id}`}
        aria-label={`View details for ${title}`}
        className="block relative overflow-hidden border-b border-[var(--border-main)] bg-[var(--bg-surface-subtle)]"
      >
        {image ? (
          <img
            src={image}
            alt={`${title} preview`}
            loading="lazy"
            className="h-52 w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-52 w-full items-center justify-center bg-[var(--bg-surface-subtle)]">
            <span className="font-display text-5xl font-extrabold text-[#d96b43]">{initial}</span>
          </div>
        )}

        {isBestOfWeek && (
          <div className="absolute top-3.5 right-3.5 rounded-full border border-[#d96b43]/30 bg-[#fbf3ee] dark:bg-[#141b16]/95 px-3 py-1 text-sm font-semibold text-[#b85028] dark:text-[#eb8b72] shadow-sm backdrop-blur-xs">
            {badgeText || 'Best of Week'}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-3 py-1 text-sm font-semibold text-[var(--text-muted)]">
            {stage}
          </span>
          {enrollmentPaused ? (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-800 dark:text-amber-300">
              Paused
            </span>
          ) : (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Enrollment open
            </span>
          )}
          {(product.isSample || isLocalDemo) && (
            <span className="rounded-full border border-[#d96b43]/30 bg-[#fbf3ee] dark:bg-[#e07a5f]/10 px-3 py-1 text-sm font-semibold text-[#b85028] dark:text-[#eb8b72]">
              {product.isSample ? 'Featured' : 'Community'}
            </span>
          )}
          {categories.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-3 py-1 text-sm font-medium text-[var(--text-subtle)]"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3 className="mt-4 font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)] break-words">
          <Link
            to={`/products/${id}`}
            className="hover:text-[#d96b43] dark:hover:text-[#e07a5f] transition-colors"
          >
            {title}
          </Link>
        </h3>

        {/* Tagline */}
        <p className="mt-2 text-base leading-relaxed text-[var(--text-muted)] break-words line-clamp-2">
          {tagline}
        </p>

        {/* Builder attribution */}
        <div className="mt-4 flex items-center gap-1.5 text-sm text-[var(--text-subtle)]">
          <span>by</span>
          <span className="font-semibold text-[var(--text-muted)]">
            {authorName}
          </span>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-6">
          <div className="flex items-center pt-4 border-t border-[var(--border-main)]">
            <Link
              to={`/products/${id}`}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#141b16] px-5 py-3 text-sm font-semibold text-[#f4ede2] shadow-warm-xs transition hover:bg-[#202c24] dark:bg-[#f3f4f0] dark:text-[#0b100c] dark:hover:bg-[#ffffff]"
            >
              View prototype
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
export { ProductCard }
