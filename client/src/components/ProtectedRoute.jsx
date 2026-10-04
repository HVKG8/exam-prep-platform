import { Navigate } from 'react-router-dom'
import { isTokenExpired } from '../utils/auth'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (isTokenExpired(token)) {
    localStorage.removeItem('token')
    return <Navigate to="/login?expired=1" replace />
  }

  return children
}

export default ProtectedRoute