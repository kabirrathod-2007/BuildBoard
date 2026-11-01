export default function SkipToContent({ targetId = 'main-content' }) {
  const handleClick = (e) => {
    const target = document.getElementById(targetId)
    if (target) {
      e.preventDefault()
      target.focus()
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:border focus:border-[var(--border-main)] focus:bg-[var(--bg-surface)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--text-main)] focus:shadow-warm-lg focus:outline-none focus:ring-2 focus:ring-[#e07a5f]"
    >
      Skip to content
    </a>
  )
}

