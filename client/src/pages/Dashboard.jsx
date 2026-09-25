import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import './Dashboard.css'

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

  if (error) return (
    <div>
      <Navbar />
      <div className="page-container">
        <p className="error-text">{error}</p>
      </div>
    </div>
  )

  if (!user) return (
    <div>
      <Navbar />
      <div className="page-container">
        <p>Loading...</p>
      </div>
    </div>
  )

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <h1>Dashboard</h1>
        <div className="card welcome-card">
          <p>Welcome, {user.name}!</p>
          <span className="role-badge">{user.role}</span>
        </div>
      </div>
    </div>
  )
}

export default Dashboard