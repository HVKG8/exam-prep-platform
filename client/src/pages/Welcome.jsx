import { Link, Navigate } from 'react-router-dom'
import useLightTheme from '../hooks/useLightTheme'
import './Welcome.css'

function Welcome() {
  useLightTheme()
  
  if (localStorage.getItem('token')) {
    return <Navigate to="/dashboard" replace />
  }

  const subjects = [
    'Big Data Analytics',
    'Natural Language Processing',
    'Cyber Security and Law',
    'Machine Learning',
    'Information Retrieval',
  ]

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
          <div className="welcome-feature-icon">🎤</div>
          <h3>Viva Prep</h3>
          <p>Practise your viva by speaking your answers out loud, like a real oral exam, and build your confidence.</p>
        </div>
        <div className="welcome-feature-card">
          <div className="welcome-feature-icon">🎯</div>
          <h3>Made for Exams</h3>
          <p>Built for Computer Engineering students in their final year, so the content stays focused.</p>
        </div>
      </section>

      <section className="welcome-how">
        <h2>How it works</h2>
        <div className="welcome-steps">
          <div className="welcome-step">
            <div className="welcome-step-number">1</div>
            <h3>Ask or browse</h3>
            <p>Pick a subject, ask your question, and choose the marks. Or open the study material for that subject.</p>
          </div>
          <div className="welcome-step">
            <div className="welcome-step-number">2</div>
            <h3>Get the right answer</h3>
            <p>The AI writes the answer at the depth your exam expects, from a short 2-mark answer to a full 10-mark one.</p>
          </div>
          <div className="welcome-step">
            <div className="welcome-step-number">3</div>
            <h3>Practise your viva</h3>
            <p>Speak your answers out loud, get follow-up questions, and walk into the exam hall confident.</p>
          </div>
        </div>
      </section>

      <section className="welcome-preview">
        <h2>Same question, the right depth</h2>
        <p className="welcome-section-sub">
          Ask: <strong>"What is overfitting?"</strong> and the answer changes with the marks.
        </p>
        <div className="welcome-preview-grid">
          <div className="welcome-answer-card">
            <span className="welcome-marks-badge">2 marks</span>
            <div className="welcome-answer-section">
              <h4>📘 Definition</h4>
              <p>
                Overfitting is when a model learns the training data too well,
                including its noise, so it performs poorly on new data.
              </p>
            </div>
          </div>

          <div className="welcome-answer-card">
            <span className="welcome-marks-badge welcome-marks-badge-big">10 marks</span>
            <div className="welcome-answer-section">
              <h4>📘 Definition</h4>
              <p>Overfitting happens when a model memorises the training data instead of learning the pattern...</p>
            </div>
            <div className="welcome-answer-section">
              <h4>⚙️ Causes</h4>
              <p>Too complex a model, too little data, too many training rounds...</p>
            </div>
            <div className="welcome-answer-section">
              <h4>💡 Example</h4>
              <p>A model scores 99% on training data but only 60% on test data...</p>
            </div>
            <div className="welcome-answer-section">
              <h4>🛠️ How to prevent it</h4>
              <p>Regularisation, cross-validation, more data, early stopping...</p>
            </div>
            <div className="welcome-answer-section">
              <h4>✅ Conclusion</h4>
              <p>A good model generalises well to data it has never seen...</p>
            </div>
          </div>
        </div>
      </section>

      <section className="welcome-subjects">
        <h2>Subjects covered</h2>
        <div className="welcome-chips">
          {subjects.map((s) => (
            <span key={s} className="welcome-chip">{s}</span>
          ))}
        </div>
      </section>

      <section className="welcome-cta">
        <h2>Ready to start preparing?</h2>
        <p>Create a free account and get your first answer in a minute.</p>
        <Link to="/register" className="welcome-btn welcome-btn-primary">
          Get Started
        </Link>
      </section>

      <footer className="welcome-footer">
        <p>Learn smarter. Prepare better.</p>
        <small>© 2026 ExamPrep AI</small>
      </footer>
    </div>
  )
}

export default Welcome