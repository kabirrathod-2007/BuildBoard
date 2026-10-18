import { Link } from 'react-router'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function NotFoundPage() {
  useDocumentTitle('Page Not Found | BuildBoard')

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors focus:outline-none flex flex-col justify-between"
    >
      <div>
        <Navbar />

        {/* 404 Hero Card */}
        <div className="mx-auto my-16 max-w-xl px-5 text-center sm:my-24">
          <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-8 shadow-warm-md sm:p-12">
            <span className="inline-block rounded-full border border-[#d96b43]/30 bg-[#d96b43]/10 px-3.5 py-1 text-sm font-bold uppercase tracking-wider text-[#d96b43]">
              404 • Page Not Found
            </span>

            <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-[var(--text-main)]">
              We couldn&apos;t find that page.
            </h1>

            <p className="mt-4 text-base sm:text-lg leading-relaxed text-[var(--text-muted)]">
              The page you&apos;re looking for doesn&apos;t exist or has moved. Explore working prototypes from indie builders or head back home.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                to="/explore"
                className="inline-flex items-center justify-center rounded-full bg-[#d96b43] px-6 py-3 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#b85028] active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d96b43] focus-visible:ring-offset-2"
              >
                Explore early products →
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-6 py-3 text-sm font-medium text-[var(--text-main)] shadow-warm-sm transition hover:bg-[var(--bg-surface-subtle)] active:translate-y-0.5"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
