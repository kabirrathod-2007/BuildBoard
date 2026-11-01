import { Link, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import SettingsMenu from './SettingsMenu.jsx'
import MobileNav from './MobileNav.jsx'

/**
 * BuildBoard Unified Navbar Component — DevHunt Architectural Theme
 */
export default function Navbar({ className = '' }) {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const isExplore = location.pathname === '/explore'
  const isProblems = location.pathname.startsWith('/problems')
  const isSubmit = location.pathname === '/products/new'
  const isDashboard = location.pathname === '/builder/dashboard'
  const isTesterActivity = location.pathname === '/tester/activity'
  const isProfile = location.pathname.startsWith('/profile')

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-[var(--border-main)] bg-[var(--bg-page)]/80 backdrop-blur-md transition-colors ${className}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Brand Logo */}
        <Link to="/" className="no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f3a6b] dark:focus-visible:outline-[#dbbf95] rounded-lg" aria-label="BuildBoard Home">
          <Logo size="md" showBadge={true} />
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1.5">
          <Link
            to="/explore"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isExplore
                ? 'text-[var(--text-main)] font-semibold bg-[var(--bg-surface-subtle)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
            }`}
          >
            Explore Feed
          </Link>

          <Link
            to="/problems"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isProblems
                ? 'text-[var(--text-main)] font-semibold bg-[var(--bg-surface-subtle)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
            }`}
          >
            Problem Hub
          </Link>

          {user && (
            <>
              <Link
                to="/tester/activity"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isTesterActivity
                    ? 'text-[var(--text-main)] font-semibold bg-[var(--bg-surface-subtle)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
                }`}
              >
                Tester Studio
              </Link>

              <Link
                to="/builder/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isDashboard
                    ? 'text-[var(--text-main)] font-semibold bg-[var(--bg-surface-subtle)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
                }`}
              >
                Builder Dashboard
              </Link>
            </>
          )}
        </nav>

        {/* Actions & Settings Menu */}
        <div className="hidden md:flex items-center gap-3">
          {/* Subtle DevHunt Vertical Divider */}
          <div className="h-5 w-px bg-[var(--border-main)] shrink-0" aria-hidden="true" />

          {/* Quick Theme Toggle */}
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2.5">
              <Link
                to="/problems/new"
                className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-main)] bg-[var(--bg-surface)] px-3 text-xs sm:text-sm font-medium text-[var(--text-main)] shadow-2xs transition hover:bg-[var(--bg-surface-subtle)]"
              >
                <span>Share Problem</span>
              </Link>

              <Link
                to="/products/new"
                className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1f3a6b] dark:bg-[#f4ede2] px-4 text-xs sm:text-sm font-semibold text-white dark:text-[#15203a] shadow-xs transition hover:bg-[#182f56]"
              >
                <span>+ Submit Prototype</span>
              </Link>

              <SettingsMenu />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/sign-in"
                className="px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/sign-up"
                className="h-9 inline-flex items-center justify-center rounded-lg bg-[#1f3a6b] dark:bg-[#f4ede2] px-4 text-sm font-semibold text-white dark:text-[#15203a] shadow-xs transition hover:bg-[#182f56]"
              >
                Sign Up
              </Link>

              <SettingsMenu />
            </div>
          )}
        </div>

        {/* Mobile Navigation Drawer & Settings */}
        <div className="flex md:hidden items-center gap-2">
          <SettingsMenu />
          <MobileNav
            user={user}
            signOut={signOut}
            links={[
              { label: 'Home', to: '/' },
              { label: 'Explore Feed', to: '/explore', current: isExplore },
              { label: 'Problem Hub', to: '/problems', current: isProblems },
              ...(user
                ? [
                    { label: 'Tester Studio', to: '/tester/activity', current: isTesterActivity },
                    { label: 'Builder Dashboard', to: '/builder/dashboard', current: isDashboard },
                    { label: 'Launch Product', to: '/products/new', current: isSubmit },
                    { label: 'Share Problem', to: '/problems/new', current: location.pathname === '/problems/new' },
                    { label: 'Profile Settings', to: '/profile/setup', current: isProfile },
                  ]
                : [
                    { label: 'Share Problem', to: '/problems/new', current: location.pathname === '/problems/new' },
                  ]),
            ]}
          />
        </div>
      </div>
    </header>
  )
}
export { Navbar }
