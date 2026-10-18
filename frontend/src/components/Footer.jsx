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
      className={`relative mt-24 border-t border-[var(--border-main)] bg-[var(--bg-page)] pt-16 pb-8 transition-colors overflow-hidden ${className}`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 pb-12 border-b border-[var(--border-main)] lg:grid-cols-5">
          {/* Brand Info */}
          <div className="flex flex-col gap-3.5 lg:col-span-2">
            <Link to="/" aria-label="BuildBoard Home" className="no-underline">
              <Logo size="sm" showBadge={true} />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
              The structured testing ground for independent software builders, student hackers, and curious early adopters.
            </p>
          </div>

          {/* Links Column: Platform */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
              Platform
            </h4>
            <Link
              to="/explore"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#d96b43] dark:hover:text-[#e07a5f]"
            >
              Discover Prototypes
            </Link>
            <Link
              to="/problems"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#d96b43] dark:hover:text-[#e07a5f]"
            >
              Problem Validation Hub
            </Link>
            <Link
              to="/problems/new"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#d96b43] dark:hover:text-[#e07a5f]"
            >
              Post Problem Hypothesis
            </Link>
            <Link
              to="/products/new"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#d96b43] dark:hover:text-[#e07a5f]"
            >
              Launch Product
            </Link>
            <Link
              to="/builder/dashboard"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#d96b43] dark:hover:text-[#e07a5f]"
            >
              Builder Dashboard
            </Link>
            <Link
              to="/tester/activity"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#d96b43] dark:hover:text-[#e07a5f]"
            >
              Tester Studio
            </Link>
          </div>

          {/* Links Column: Community */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
              Community
            </h4>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#d96b43] dark:hover:text-[#e07a5f]"
            >
              GitHub Repository
            </a>
            <Link
              to="/explore"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#d96b43] dark:hover:text-[#e07a5f]"
            >
              Early Feedback
            </Link>
            <Link
              to="/profile/setup"
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[#d96b43] dark:hover:text-[#e07a5f]"
            >
              Tester Profiles
            </Link>
          </div>

          {/* Links Column: System & Health */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
              System
            </h4>
            <div className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-medium text-[var(--text-main)]">Operational Studio</span>
            </div>
            <p className="text-sm text-[var(--text-subtle)] leading-relaxed">
              All systems online. Fast client-side performance and persistent state.
            </p>
          </div>
        </div>

        {/* Bottom copyright and legal */}
        <div className="flex flex-col gap-4 pt-8 text-sm text-[var(--text-subtle)] sm:flex-row sm:items-center sm:justify-between">
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

      {/* Signature Giant Watermark */}
      <div
        className="mt-6 text-center font-display font-bold text-[clamp(3.5rem,11vw,8.5rem)] tracking-tight text-black/[0.03] dark:text-white/[0.03] select-none pointer-events-none leading-none"
        aria-hidden="true"
      >
        buildboard
      </div>
    </footer>
  )
}
