import { useLayoutEffect } from 'react'

// Keeps a page in light theme, even if the user saved dark mode
export default function useLightTheme() {
  useLayoutEffect(() => {
    document.documentElement.classList.remove('dark')

    return () => {
      if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark')
      }
    }
  }, [])
}