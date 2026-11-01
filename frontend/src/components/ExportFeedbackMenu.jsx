import { useState, useRef, useEffect } from 'react'

function slugify(text) {
  return (text || 'feedback')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
}

function generateFeedbackCsv(productName, feedbackList) {
  const headers = ['ID', 'Date', 'Product', 'Tester Name', 'Role', 'Category', 'Helpful', 'Experience Critique', 'Likes', 'Maker Reply']
  const escapeCell = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`

  const rows = feedbackList.map((item) => {
    let replyText = ''
    if (item.reply) {
      replyText = typeof item.reply === 'object' ? item.reply.text || '' : String(item.reply)
    }
    return [
      item.id,
      item.createdAt ? new Date(item.createdAt).toISOString() : '',
      productName || item.productName || 'BuildBoard Prototype',
      item.testerName || 'Community Tester',
      item.testerRole || '',
      item.category || '',
      item.isHelpful ? 'YES' : 'NO',
      item.experience || '',
      item.likes || '',
      replyText,
    ].map(escapeCell).join(',')
  })

  return [headers.join(','), ...rows].join('\r\n')
}

function generateFeedbackMarkdown(productName, feedbackList) {
  const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const title = `# Feedback Report: ${productName || 'BuildBoard Products'}\nGenerated on: ${formattedDate}\nTotal Critiques: ${feedbackList.length}\n\n---\n`

  const sections = feedbackList.map((item, idx) => {
    let replyText = ''
    if (item.reply) {
      replyText = typeof item.reply === 'object' ? item.reply.text || '' : String(item.reply)
    }
    return `### Critique #${idx + 1} - ${item.category} ${item.isHelpful ? '⭐ [Marked Helpful]' : ''}
- **Tester:** ${item.testerName || 'Community Tester'} (${item.testerRole || 'Tester'})
- **Date:** ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
- **Product:** ${productName || item.productName || 'Prototype'}

#### Usability Friction & Critique:
> ${item.experience || 'No description provided.'}

${item.likes ? `#### What Worked Well:\n> ${item.likes}\n` : ''}
${replyText ? `#### Maker Response:\n> ${replyText}\n` : ''}
---`
  }).join('\n\n')

  return `${title}\n${sections}`
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function ExportFeedbackMenu({
  productName = 'Product',
  feedbackList = [],
  onNotice,
  className = '',
  buttonLabel = 'Export',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleExportCsv = () => {
    if (feedbackList.length === 0) {
      if (onNotice) onNotice({ type: 'error', message: 'No feedback items to export.' })
      return
    }
    const csvContent = generateFeedbackCsv(productName, feedbackList)
    downloadFile(`buildboard-feedback-${slugify(productName)}.csv`, csvContent, 'text/csv;charset=utf-8;')
    setIsOpen(false)
    if (onNotice) onNotice({ type: 'success', message: `Exported ${feedbackList.length} feedback items to CSV.` })
  }

  const handleExportMarkdown = () => {
    if (feedbackList.length === 0) {
      if (onNotice) onNotice({ type: 'error', message: 'No feedback items to export.' })
      return
    }
    const mdContent = generateFeedbackMarkdown(productName, feedbackList)
    downloadFile(`buildboard-feedback-${slugify(productName)}.md`, mdContent, 'text/markdown;charset=utf-8;')
    setIsOpen(false)
    if (onNotice) onNotice({ type: 'success', message: `Exported ${feedbackList.length} feedback items to Markdown.` })
  }

  const handleCopySummary = async () => {
    if (feedbackList.length === 0) {
      if (onNotice) onNotice({ type: 'error', message: 'No feedback items to copy.' })
      return
    }
    try {
      const summary = `📊 Feedback Digest for ${productName} (${feedbackList.length} critiques):\n\n` +
        feedbackList.map((f, i) => `${i + 1}. [${f.category}] "${f.experience.slice(0, 160)}${f.experience.length > 160 ? '...' : ''}" - by ${f.testerName || 'Tester'}${f.isHelpful ? ' ⭐' : ''}`).join('\n\n')
      await navigator.clipboard.writeText(summary)
      setIsOpen(false)
      if (onNotice) onNotice({ type: 'success', message: 'Feedback digest copied to clipboard!' })
    } catch {
      if (onNotice) onNotice({ type: 'error', message: 'Could not access clipboard.' })
    }
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={feedbackList.length === 0}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm font-semibold text-[var(--text-main)] shadow-warm-xs transition-colors focus-visible:outline-2 focus-visible:outline-[#1f3a6b] ${
          feedbackList.length === 0
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-[var(--bg-surface-subtle)] hover:border-[#1f3a6b] dark:hover:border-[#dbbf95] cursor-pointer'
        }`}
      >
        <svg className="h-4 w-4 text-[var(--text-subtle)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>{buttonLabel}</span>
        <svg className={`h-3.5 w-3.5 transition-transform duration-200 text-[var(--text-subtle)] ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Export Feedback Options"
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-2 shadow-warm-lg z-30 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-subtle)] border-b border-[var(--border-main)]">
            Export {feedbackList.length} {feedbackList.length === 1 ? 'Critique' : 'Critiques'}
          </div>

          <div className="py-1 space-y-0.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleExportCsv}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] transition-colors text-left cursor-pointer"
            >
              <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <div>
                <span className="block">Download CSV</span>
                <span className="text-[10px] text-[var(--text-subtle)] font-normal">Excel & Google Sheets ready</span>
              </div>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleExportMarkdown}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] transition-colors text-left cursor-pointer"
            >
              <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <div>
                <span className="block">Download Markdown</span>
                <span className="text-[10px] text-[var(--text-subtle)] font-normal">GitHub, Linear & Notion</span>
              </div>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleCopySummary}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] transition-colors text-left cursor-pointer"
            >
              <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <div>
                <span className="block">Copy Executive Digest</span>
                <span className="text-[10px] text-[var(--text-subtle)] font-normal">1-click clipboard summary</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

