import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

function Dashboard() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setUser(response.data)
      } catch (err) {
        setError('Could not load user info')
      }
    }
    fetchUser()
  }, [])

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (error) return <p style={{ color: 'red' }}>{error}</p>
  if (!user) return <p>Loading...</p>

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name}!</p>
      <p>Role: {user.role}</p>
      <Link to="/solver">Go to AI Solver</Link>
      <Link to="/materials" style={{ marginLeft: '10px' }}>Go to Materials</Link>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}

export default Dashboard