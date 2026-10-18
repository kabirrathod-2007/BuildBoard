import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ className = '', variant = 'default' }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-coral cursor-pointer ${
        variant === 'header-dark'
          ? 'border-white/20 bg-white/10 text-white hover:bg-white/15 dark:border-white/10 dark:bg-white/5'
          : 'border-theme-border bg-theme-surface text-theme-text shadow-warm-sm hover:bg-theme-subtle'
      } ${className}`}
    >
      {isDark ? (
        <>
          <span key="sun-icon" className="tdev-icon-swap inline-flex">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          </span>
          <span key="sun-text" className="hidden xs:inline sm:inline text-sm tdev-text-swap">Light</span>
        </>
      ) : (
        <>
          <span key="moon-icon" className="tdev-icon-swap inline-flex">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </span>
          <span key="moon-text" className="hidden xs:inline sm:inline text-sm tdev-text-swap">Dark</span>
        </>
      )}
    </button>
  )
}
