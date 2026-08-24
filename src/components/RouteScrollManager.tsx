import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteScrollManager() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      requestAnimationFrame(() => {
        const target = document.getElementById(id)
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      return
    }

    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname, location.hash])

  return null
}
