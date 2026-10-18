import { useState, useEffect, useRef, useId } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import { useDemoData } from '../context/DemoDataContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

/**
 * SettingsMenu Component
 * Accessible Settings popover housing user profile details,
 * direct link to profile preferences, light/dark theme toggle,
 * and session controls.
 */
export default function SettingsMenu({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const location = useLocation()

  const { user, signOut } = useAuth()
  const { getProfile } = useDemoData()
  const { theme, toggleTheme } = useTheme()

  const userProfile = user?.email ? getProfile(user.email) : null
  const displayName =
    userProfile?.displayName?.trim() ||
    (user?.email ? user.email.split('@')[0] : 'Member')
  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : 'U'

  // Close menu on route change
  const [prevPathname, setPrevPathname] = useState(location.pathname)
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname)
    setIsOpen(false)
  }

  // Keyboard navigation & click outside
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
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

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* Settings Trigger Button */}
      <button
        ref={triggerRef}
        id={`${menuId}-trigger`}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={`${menuId}-menu`}
        aria-label="Settings and preferences"
        title="Settings and preferences"
        className={`inline-flex items-center gap-2 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm font-semibold text-[var(--text-main)] shadow-warm-xs transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d96b43] focus-visible:ring-offset-2 cursor-pointer ${
          isOpen ? 'ring-2 ring-[#d96b43]/40 border-[#d96b43]' : ''
        }`}
      >
        {/* Recognizable Gear Icon */}
        <svg
          className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 ${
            isOpen ? 'rotate-45 text-[#d96b43]' : ''
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>

        <span className="hidden sm:inline">Settings</span>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          id={`${menuId}-menu`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby={`${menuId}-trigger`}
          className="absolute right-0 top-full mt-2 w-72 origin-top-right rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-4 text-[var(--text-main)] shadow-warm-xl focus:outline-none z-50 tdev-dropdown"
        >
          {/* User Account / Profile Summary */}
          {user ? (
            <div className="flex items-center gap-3 pb-3.5 border-b border-[var(--border-main)]">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d96b43]/15 font-bold text-sm text-[#d96b43]"
                aria-hidden="true"
              >
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[var(--text-main)]">
                  {displayName}
                </p>
                <p className="truncate font-mono text-sm text-[var(--text-muted)]">
                  {user.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="pb-3.5 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                  Guest Session
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-[var(--text-main)]">
                Local Guest
              </p>
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                Sign in to save profile and participate.
              </p>
            </div>
          )}

          {/* Navigation & Profile Actions */}
          <div className="py-2.5 space-y-1">
            {user ? (
              <Link
                to="/profile/setup"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d96b43]"
              >
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[var(--text-subtle)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Profile & Preferences</span>
                </div>
                <span className="text-sm text-[var(--text-muted)]">Edit →</span>
              </Link>
            ) : (
              <Link
                to="/sign-in"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d96b43]"
              >
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[var(--text-subtle)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  <span>Sign in to account</span>
                </div>
                <span className="text-sm text-[var(--text-muted)]">→</span>
              </Link>
            )}
          </div>

          {/* Dedicated Appearance / Theme Control */}
          <div className="border-t border-[var(--border-main)] pt-3 pb-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Theme
              </span>
              <div className="inline-flex items-center rounded-lg border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-0.5">
                <button
                  type="button"
                  onClick={() => theme !== 'light' && toggleTheme()}
                  aria-pressed={theme === 'light'}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold transition cursor-pointer ${
                    theme === 'light'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-warm-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => theme !== 'dark' && toggleTheme()}
                  aria-pressed={theme === 'dark'}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold transition cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-warm-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </div>

          {/* Session Sign Out Action */}
          {user && signOut && (
            <div className="border-t border-[var(--border-main)] pt-2 mt-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false)
                  signOut()
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <span>Sign out</span>
                <svg className="h-3.5 w-3.5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
