import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { useDemoData } from '../context/DemoDataContext.jsx'

export default function MobileNav({
  links = [],
  user = null,
  signOut = null,
  variant = 'default', // 'default' or 'dark'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const location = useLocation()
  const { getProfile } = useDemoData()
  const userProfile = user?.email ? getProfile(user.email) : null
  const displayName = userProfile?.displayName?.trim()

  // Close menu when route changes
  const [prevPathname, setPrevPathname] = useState(location.pathname)
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname)
    setIsOpen(false)
  }

  // Support Escape key to close menu and return focus to toggle button
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const isDark = variant === 'dark'

  return (
    <div className="relative md:hidden">
      {/* Menu Toggle Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e07a5f] focus-visible:ring-offset-2 cursor-pointer ${
          isDark
            ? 'border-white/20 bg-white/10 text-white hover:bg-white/15'
            : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] shadow-warm-sm hover:bg-[var(--bg-surface-subtle)]'
        }`}
      >
        {isOpen ? (
          <span key="close-icon" className="tdev-icon-swap inline-flex">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        ) : (
          <span key="hamburger-icon" className="tdev-icon-swap inline-flex">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </span>
        )}
      </button>

      {/* Collapsible Mobile Menu Panel */}
      {isOpen && (
        <div
          ref={menuRef}
          id="mobile-nav-panel"
          className={`absolute right-0 top-12 z-50 w-72 max-w-[calc(100vw-2rem)] origin-top-right rounded-2xl border p-5 shadow-warm-xl tdev-dropdown ${
            isDark
              ? 'border-white/15 bg-[#140f0d] text-white shadow-black/60'
              : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] shadow-warm-xl'
          }`}
        >
          {/* Main Route & Section Links */}
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-1">
            {links.map((link) => {
              const linkClasses = `flex min-h-[44px] items-center rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e07a5f] ${
                link.current
                  ? isDark
                    ? 'bg-white/10 text-white font-semibold'
                    : 'bg-[var(--bg-surface-subtle)] text-[var(--text-main)] font-semibold'
                  : isDark
                  ? 'text-white/80 hover:bg-white/10 hover:text-white'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)]'
              }`

              if (link.to) {
                return (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={linkClasses}
                  >
                    {link.label}
                  </Link>
                )
              }

              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={linkClasses}
                >
                  {link.label}
                </a>
              )
            })}
          </nav>

          {/* Account & Builder Actions */}
          <div className={`mt-4 border-t pt-4 ${isDark ? 'border-white/10' : 'border-[var(--border-main)]'}`}>
            {user ? (
              <div className="flex flex-col space-y-2">
                <div className={`rounded-xl px-3 py-2 text-sm ${isDark ? 'bg-white/5 text-white/70' : 'bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]'}`}>
                  <span className="block text-sm font-bold uppercase tracking-wider text-[#e07a5f]">Signed in as</span>
                  {displayName ? (
                    <div className="mt-0.5">
                      <span className="block font-bold text-[var(--text-main)] text-sm">{displayName}</span>
                      <span className="break-all font-mono text-xs opacity-70">{user.email}</span>
                    </div>
                  ) : (
                    <span className="break-all font-mono font-medium text-sm">{user.email}</span>
                  )}
                </div>

                <Link
                  to="/tester/activity"
                  onClick={() => setIsOpen(false)}
                  className={`flex min-h-[44px] items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    isDark
                      ? 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                      : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] shadow-warm-sm hover:bg-[var(--bg-surface-subtle)]'
                  }`}
                >
                  <span>Tester Activity</span>
                  <span aria-hidden="true">→</span>
                </Link>

                <Link
                  to="/builder/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={`flex min-h-[44px] items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    isDark
                      ? 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                      : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] shadow-warm-sm hover:bg-[var(--bg-surface-subtle)]'
                  }`}
                >
                  <span>Builder Dashboard</span>
                  <span aria-hidden="true">→</span>
                </Link>


                <Link
                  to="/products/new"
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-[44px] items-center justify-center rounded-xl bg-[#e07a5f] px-3.5 py-2 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#eb8b72]"
                >
                  + Submit product
                </Link>

                {signOut && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      signOut()
                    }}
                    className="flex min-h-[44px] items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-500 transition hover:bg-rose-500/10 cursor-pointer"
                  >
                    Sign out
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  to="/sign-in"
                  onClick={() => setIsOpen(false)}
                  className={`flex min-h-[44px] items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    isDark
                      ? 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                      : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] shadow-warm-sm hover:bg-[var(--bg-surface-subtle)]'
                  }`}
                >
                  Sign in
                </Link>
                <Link
                  to="/sign-up"
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-[44px] items-center justify-center rounded-xl bg-[#e07a5f] px-4 py-2 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#eb8b72]"
                >
                  Join BuildBoard
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
