import { Link, Navigate } from 'react-router-dom'
import './Welcome.css'

function Welcome() {
  if (localStorage.getItem('token')) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="welcome-page">
      <nav className="welcome-nav">
        <div className="welcome-logo">🎓 ExamPrep AI</div>
        <Link to="/login" className="welcome-btn welcome-btn-secondary">
          Sign in
        </Link>
      </nav>

      <section className="welcome-hero">
        <h1>
          Prepare for your exams <span>smarter</span> with AI
        </h1>
        <p>
          Get marks-based answers, study materials, and revision help,
          all in one place for engineering students.
        </p>
        <div className="welcome-actions">
          <Link to="/register" className="welcome-btn welcome-btn-primary">
            Get Started
          </Link>
          <Link to="/login" className="welcome-btn welcome-btn-secondary">
            Sign in
          </Link>
        </div>
      </section>

      <section className="welcome-features">
        <div className="welcome-feature-card">
          <div className="welcome-feature-icon">🤖</div>
          <h3>AI Tutor</h3>
          <p>Ask any question and pick the marks (2, 5 or 10). You get an answer written at the right depth.</p>
        </div>
        <div className="welcome-feature-card">
          <div className="welcome-feature-icon">📚</div>
          <h3>Study Material</h3>
          <p>Notes, syllabus, past papers and quick revision sheets, sorted by subject and unit.</p>
        </div>
        <div className="welcome-feature-card">
          <div className="welcome-feature-icon">🎯</div>
          <h3>Made for Exams</h3>
          <p>Built for Computer Engineering students in their final year, so the content stays focused.</p>
        </div>
      </section>

      <footer className="welcome-footer">
        <p>Learn smarter. Prepare better.</p>
        <small>© 2026 ExamPrep AI</small>
      </footer>
    </div>
  )
}

export default Welcome