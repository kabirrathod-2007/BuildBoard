import { Link, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from './Logo.jsx'
import SettingsMenu from './SettingsMenu.jsx'
import MobileNav from './MobileNav.jsx'

/**
 * BuildBoard Unified Navbar Component
 * Editorial maker studio navigation bar with subtle backdrop blur,
 * warm terracotta accents, active indicators, and accessible Settings menu.
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
      className={`sticky top-0 z-40 w-full border-b border-[var(--border-main)] bg-[var(--bg-surface)]/90 backdrop-blur-md transition-colors ${className}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Brand Hallmark Logo */}
        <Link to="/" className="no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d96b43] rounded-lg" aria-label="BuildBoard Home">
          <Logo size="md" showBadge={true} />
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-7">
          <Link
            to="/explore"
            className={`text-sm font-semibold transition-colors ${
              isExplore
                ? 'text-[var(--text-main)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Explore Feed
          </Link>

          <Link
            to="/problems"
            className={`text-sm font-semibold transition-colors ${
              isProblems
                ? 'text-[var(--text-main)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Problem Hub
          </Link>

          {user && (
            <>
              <Link
                to="/tester/activity"
                className={`text-sm font-semibold transition-colors ${
                  isTesterActivity
                    ? 'text-[var(--text-main)] font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Tester Studio
              </Link>

              <Link
                to="/builder/dashboard"
                className={`text-sm font-semibold transition-colors ${
                  isDashboard
                    ? 'text-[var(--text-main)] font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Builder Dashboard
              </Link>
            </>
          )}
        </nav>

        {/* Actions & Settings Menu */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/problems/new"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text-main)] shadow-warm-xs transition hover:bg-[var(--bg-surface-subtle)] hover:border-[#d96b43]"
              >
                <span>+ Validate Problem</span>
              </Link>

              <Link
                to="/products/new"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#d96b43] px-4 py-2 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#e57b54] hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>+ Launch Product</span>
              </Link>

              <SettingsMenu />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/sign-in"
                className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] shadow-warm-sm transition hover:bg-[var(--bg-surface-subtle)] hover:border-[var(--border-strong)]"
              >
                Sign in
              </Link>
              <Link
                to="/sign-up"
                className="rounded-full bg-[#141b16] px-4 py-2 text-sm font-semibold text-[#f4ede2] shadow-warm-sm transition hover:bg-[#202c24] hover:-translate-y-0.5 dark:bg-[#f3f4f0] dark:text-[#0b100c] dark:hover:bg-[#ffffff]"
              >
                Join BuildBoard
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
                    { label: 'Validate Problem', to: '/problems/new', current: location.pathname === '/problems/new' },
                    { label: 'Profile Settings', to: '/profile/setup', current: isProfile },
                  ]
                : [
                    { label: 'Validate Problem', to: '/problems/new', current: location.pathname === '/problems/new' },
                  ]),
            ]}
          />
        </div>
      </div>
    </header>
  )
}
export { Navbar }
