// Reads the expiry date stored inside the login token (no server call needed)
export function isTokenExpired(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    return !payload.exp || payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}