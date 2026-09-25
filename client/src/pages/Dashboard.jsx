import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'

function Dashboard() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

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

  if (error) return <p style={{ color: 'red' }}>{error}</p>
  if (!user) return <p>Loading...</p>

  return (
    <div>
      <Navbar />
      <h1>Dashboard</h1>
      <p>Welcome, {user.name}!</p>
      <p>Role: {user.role}</p>
    </div>
  )
}

export default Dashboard