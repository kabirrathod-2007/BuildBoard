import { useEffect } from 'react'

export function useDocumentTitle(title) {
  useEffect(() => {
    const previousTitle = document.title
    if (title) {
      document.title = title
    }
    return () => {
      document.title = previousTitle
    }
  }, [title])
}
