import { useEffect } from 'react'
import { useLocation } from 'react-router'

/**
 * ScrollToTop component
 *
 * Automatically resets the window scroll position to the top
 * whenever the user navigates to a different page route.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // If the URL has an anchor hash (e.g. #faq), scroll to that element
    if (hash) {
      const id = hash.replace('#', '')
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }

    // Scroll window and root elements directly to the top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname, hash])

  return null
}
