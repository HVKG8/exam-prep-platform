import { API_URL } from '../config'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../components/Sidebar'
import './Dashboard.css'

function Dashboard() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ materials: null, subjects: null, conversations: null })

  useEffect(() => {
    async function fetchAll() {
      const token = localStorage.getItem('token')

      try {
        const userRes = await axios.get(API_URL + '/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setUser(userRes.data)
      } catch (err) {
        setError('Could not load user info')
        return
      }

      try {
        const [materialsRes, subjectsRes, convRes] = await Promise.all([
          axios.get(API_URL + '/api/materials', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(API_URL + '/api/subjects', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(API_URL + '/api/conversations', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        setStats({
          materials: materialsRes.data.length,
          subjects: subjectsRes.data.length,
          conversations: convRes.data.length,
        })
      } catch (err) {
        console.error('Could not load stats', err)
      }
    }
    fetchAll()
  }, [])

  if (error) return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-container">
        <p className="error-text">{error}</p>
      </div>
    </div>
  )

  if (!user) return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-container">
        <p>Loading...</p>
      </div>
    </div>
  )

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-container">

        <div className="dashboard-hero">
          <div className="dashboard-hero-text">
            <h1>👋 Welcome back, {user.name}!</h1>
            <p className="dashboard-subtitle">Small steps every day lead to big results.</p>
          </div>
          <div className="dashboard-hero-decoration">
            <span className="floating-icon icon-1">📚</span>
            <span className="floating-icon icon-2">🤖</span>
            <span className="floating-icon icon-3">✏️</span>
            <span className="floating-icon icon-4">🎓</span>
            <p className="hero-decoration-tagline">Better Preparation.<br />Brighter Future.</p>
          </div>
        </div>

        <div className="dashboard-stats-row">
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">📘</div>
            <div>
              <p className="stat-number">{stats.materials ?? '—'}</p>
              <p className="stat-label">Materials Available</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">📖</div>
            <div>
              <p className="stat-number">{stats.subjects ?? '—'}</p>
              <p className="stat-label">Subjects Covered</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-purple">💬</div>
            <div>
              <p className="stat-number">{stats.conversations ?? '—'}</p>
              <p className="stat-label">AI Conversations</p>
            </div>
          </div>
        </div>

        <div className="dashboard-feature-grid">
          <div className="feature-card">
            <div className="feature-icon feature-icon-blue">📘</div>
            <h2>Material</h2>
            <p>Access well-structured notes, PDFs, diagrams and important questions for all your subjects.</p>
            <Link to="/materials" className="feature-btn feature-btn-primary">
              Explore Materials <span>→</span>
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon feature-icon-purple">🤖</div>
            <h2>AI Tutor</h2>
            <p>Ask questions, get detailed answers, explain concepts, and clear your doubts instantly — tailored for your exams.</p>
            <Link to="/solver" className="feature-btn feature-btn-primary">
              Start Chatting <span>→</span>
            </Link>
          </div>
        </div>

        <div className="dashboard-quick-section">
          <h2 className="dashboard-section-title">Useful for You</h2>
          <p className="dashboard-section-subtitle">Quick access to tools and resources to make your study journey easier.</p>

          <div className="quick-access-grid">
            <Link to="/materials?type=syllabus" className="quick-card">
              <div className="quick-icon quick-icon-blue">📄</div>
              <h3>Syllabus</h3>
              <p>View your college syllabus and important topics.</p>
            </Link>

            <Link to="/materials?type=question-paper" className="quick-card">
              <div className="quick-icon quick-icon-cyan">📝</div>
              <h3>Past Year Papers</h3>
              <p>Practice with previous year questions.</p>
            </Link>

            <Link to="/materials?type=notes" className="quick-card">
              <div className="quick-icon quick-icon-purple">📚</div>
              <h3>Study Notes</h3>
              <p>Quick revision notes for key topics.</p>
            </Link>

            <Link to="/materials?type=diagram" className="quick-card">
              <div className="quick-icon quick-icon-indigo">🖼️</div>
              <h3>Diagrams</h3>
              <p>Visual concepts for better understanding.</p>
            </Link>

                        <Link to="/materials?type=revision" className="quick-card">
              <div className="quick-icon quick-icon-orange">⚡</div>
              <h3>Quick Revision</h3>
              <p>Important formulas, short notes & more.</p>
            </Link>

            <Link to="/viva" className="quick-card">
              <div className="quick-icon quick-icon-cyan">🎤</div>
              <h3>Viva Prep</h3>
              <p>Practise answering out loud with an AI examiner.</p>
            </Link>
          </div>
        </div>

        <div className="dashboard-help-banner">
          <div className="help-banner-text">
            <span className="help-banner-icon">💡</span>
            <div>
              <h3>Need something specific?</h3>
              <p>Stuck on a topic or don't know what to study next? We're here to help.</p>
            </div>
          </div>
          <Link to="/solver" className="feature-btn feature-btn-primary">
            Get Help <span>→</span>
          </Link>
        </div>

        <div className="dashboard-footer-tagline">
          <span>🎓</span> Learn smarter. Prepare better. Succeed confidently.
        </div>
      </div>
    </div>
  )
}

export default Dashboard