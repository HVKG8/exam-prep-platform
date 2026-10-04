import useLightTheme from '../hooks/useLightTheme'
import './Legal.css'

function LegalLayout({ title, updated, children }) {
  useLightTheme()

  return (
    <div className="legal-page">
      <div className="legal-card">
        <a href="/" className="legal-logo">
          🎓 ExamPrep <span>AI</span>
        </a>
        <h1>{title}</h1>
        <p className="legal-updated">Last updated: {updated}</p>
        {children}
        <p className="legal-back">
          <a href="/register">← Back to sign up</a> · <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  )
}

export default LegalLayout