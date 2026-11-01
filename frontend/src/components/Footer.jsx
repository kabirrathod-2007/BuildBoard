import { Link } from 'react-router'
import Logo from './Logo.jsx'

/**
 * BuildBoard Unified Footer Component
 * Matches the warm editorial layout, watermark branding,
 * operational status indicator, and legal links, fully styled with Tailwind CSS v4.
 */
export default function Footer({ className = '' }) {
  return (
    <footer
      className={`relative mt-24 border-t border-[var(--border-main)] bg-[var(--bg-page)] pt-16 pb-10 transition-colors overflow-hidden ${className}`}
    >

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 pb-12 border-b border-[var(--border-main)] lg:grid-cols-4">
          {/* Brand Info */}
          <div className="flex flex-col gap-3.5 lg:col-span-2">
            <Link to="/" aria-label="BuildBoard Home" className="no-underline">
              <Logo size="sm" showBadge={true} />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
              The direct testing ground for independent software builders, student hackers, and curious early adopters.
            </p>
            <div className="pt-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                <span>All systems operational</span>
              </div>
            </div>
          </div>

          {/* Links Column: Platform */}
          <div className="flex flex-col gap-2.5">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)] mb-1">
              Platform
            </h4>
            <Link
              to="/explore"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#1f3a6b] dark:hover:text-[#dbbf95]"
            >
              Discover Prototypes
            </Link>
            <Link
              to="/problems"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#1f3a6b] dark:hover:text-[#dbbf95]"
            >
              Problem Validation Hub
            </Link>
            <Link
              to="/problems/new"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#1f3a6b] dark:hover:text-[#dbbf95]"
            >
              Post Problem Hypothesis
            </Link>
            <Link
              to="/products/new"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#1f3a6b] dark:hover:text-[#dbbf95]"
            >
              Launch Product
            </Link>
            <Link
              to="/builder/dashboard"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#1f3a6b] dark:hover:text-[#dbbf95]"
            >
              Builder Dashboard
            </Link>
            <Link
              to="/tester/activity"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#1f3a6b] dark:hover:text-[#dbbf95]"
            >
              Tester Studio
            </Link>
          </div>

          {/* Links Column: Community */}
          <div className="flex flex-col gap-2.5">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)] mb-1">
              Community
            </h4>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#1f3a6b] dark:hover:text-[#dbbf95]"
            >
              GitHub Repository
            </a>
            <Link
              to="/explore"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#1f3a6b] dark:hover:text-[#dbbf95]"
            >
              Early Feedback
            </Link>
            <Link
              to="/profile/setup"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#1f3a6b] dark:hover:text-[#dbbf95]"
            >
              Tester Profiles
            </Link>
          </div>
        </div>

        {/* Bottom copyright and legal */}
        <div className="flex flex-col gap-4 pt-8 text-xs text-[var(--text-subtle)] sm:flex-row sm:items-center sm:justify-between font-mono">
          <p>© {new Date().getFullYear()} BuildBoard. Crafted for independent software creators.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[var(--text-main)] transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-[var(--text-main)] transition-colors cursor-pointer">
              Terms of Service
            </span>
          </div>
        </div>
      </div>

      {/* Signature DevHunt Subtle Wordmark */}
      <div
        className="mt-6 text-center font-display font-bold text-[clamp(3.5rem,11vw,8.5rem)] tracking-tight text-black/[0.03] dark:text-white/[0.03] select-none pointer-events-none leading-none"
        aria-hidden="true"
      >
        buildboard
      </div>
    </footer>
  )
}
