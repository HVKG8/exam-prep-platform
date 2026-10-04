import axios from 'axios'

const PUBLIC_PAGES = ['/', '/login', '/register', '/forgot-password']
let redirecting = false

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const headers = error.config?.headers

    // Did this request carry a login token?
    const sentToken =
      headers &&
      (typeof headers.get === 'function'
        ? headers.get('Authorization')
        : headers.Authorization)

    // 401 on a request that sent a token = the token is bad or expired.
    // A 403 on the /me check at app start means the same thing.
    // Other 403s (for example a student opening a teacher-only action) are left alone.
    const tokenRejected =
      sentToken && (status === 401 || (status === 403 && url.includes('/api/auth/me')))

    if (tokenRejected && !redirecting && !PUBLIC_PAGES.includes(window.location.pathname)) {
      redirecting = true
      localStorage.removeItem('token')
      window.location.assign('/login?expired=1')
    }

    return Promise.reject(error)
  }
)