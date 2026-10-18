import { useState } from 'react'
import { Link } from 'react-router'
import { useDemoData } from '../context/DemoDataContext.jsx'

/**
 * BuildBoard Showcase Carousel Component
 * Continuous smooth-scrolling marquee showcase of early products.
 * Features accessible pause/resume controls, authentic interface thumbnails,
 * deliberate editorial pace, and readable typography.
 */
export default function ShowcaseCarousel({ className = '' }) {
  const { products, getProfile } = useDemoData()
  const [isPaused, setIsPaused] = useState(false)

  // Take top featured products and duplicate for seamless looping marquee
  const featured = products.slice(0, 5)
  if (featured.length === 0) return null
  const displayItems = [...featured, ...featured]

  return (
    <div
      className={`relative w-full py-4 ${className}`}
      aria-label="Featured prototypes showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] py-6">
        <div
          className={`animate-marquee flex gap-6 px-6 ${isPaused ? 'marquee-paused' : ''}`}
          style={{ animationPlayState: isPaused ? 'paused' : undefined }}
        >
          {displayItems.map((prod, idx) => {
            const id = prod.id || prod._id
            const category = prod.categories?.[0] || prod.category || 'Developer Tools'
            const profile = prod.creatorEmail ? getProfile(prod.creatorEmail) : null
            const authorName =
              profile?.displayName?.trim() ||
              prod.maker ||
              (prod.creatorEmail ? prod.creatorEmail.split('@')[0] : 'Maker')
            const isSample = Boolean(prod.isSample)

            return (
              <Link
                to={`/products/${id}`}
                key={`${id}-${idx}`}
                className="group relative flex w-[410px] min-w-[410px] flex-col overflow-hidden rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-4 shadow-warm-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#d96b43] hover:shadow-warm-md no-underline"
              >
                {/* Interface Thumbnail Preview */}
                <div className="mb-4 aspect-[16/10] w-full overflow-hidden rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)]">
                  {prod.image ? (
                    <img
                      src={prod.image}
                      alt={`${prod.name} interface preview`}
                      className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-[var(--text-subtle)]">
                      {prod.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-3 py-1 text-sm font-medium text-[var(--text-muted)]">
                      {category}
                    </span>
                    {isSample && (
                      <span className="rounded-full border border-[#d96b43]/25 bg-[#d96b43]/8 px-3 py-1 text-sm font-medium text-[#b85028] dark:text-[#eb8b72]">
                        Sample prototype
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-display text-lg font-bold text-[var(--text-main)] group-hover:text-[#d96b43] dark:group-hover:text-[#e07a5f] transition-colors truncate">
                      {prod.name}
                    </h4>
                    <span className="shrink-0 text-sm font-semibold text-[#d96b43] dark:text-[#e07a5f] group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                      ↗
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-[var(--text-muted)] line-clamp-2">
                    {prod.tagline}
                  </p>

                  {/* Maker Footer */}
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-[var(--border-subtle)] text-sm text-[var(--text-subtle)]">
                    <span className="truncate">by {authorName}</span>
                    <span className="rounded-full bg-[var(--bg-surface-subtle)] px-2.5 py-1 text-sm font-medium">
                      {prod.stage || 'Working prototype'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
export { ShowcaseCarousel }
