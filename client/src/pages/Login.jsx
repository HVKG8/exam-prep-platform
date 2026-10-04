import { API_URL } from '../config'
import { useState, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import useLightTheme from '../hooks/useLightTheme'
import CheckEmailNotice from '../components/CheckEmailNotice'
import './Auth.css'

function Login() {
  useLightTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState(
    new URLSearchParams(window.location.search).get('expired')
      ? 'Your session has expired. Please sign in again.'
      : ''
  )
  const [pendingEmail, setPendingEmail] = useState(null) // set when the email is not verified yet
  const navigate = useNavigate()
  const hiddenGoogleBtn = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      const response = await axios.post(API_URL + '/api/auth/login', {
        email,
        password,
      })
      localStorage.setItem('token', response.data.token)
      navigate('/dashboard')
    } catch (err) {
      if (err.response?.data?.needsVerification) {
        setPendingEmail(err.response.data.email || email)
        return
      }
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    try {
      const response = await axios.post(API_URL + '/api/auth/google', {
        credential: credentialResponse.credential,
      })
      localStorage.setItem('token', response.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError('Google sign-in failed')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-blob-center"></div>
      <div className="auth-logo">
        <span className="auth-logo-icon">🎓</span>
        <span className="auth-logo-text">ExamPrep <span className="auth-logo-accent">AI</span></span>
      </div>
      <div className="card auth-card">
        {pendingEmail ? (
          <CheckEmailNotice
            email={pendingEmail}
            justSent={true}
            sendFailed={false}
            backLabel="← Back to sign in"
            onBack={() => setPendingEmail(null)}
          />
        ) : (
          <>
            <div className="auth-heading">
              <h2>Welcome back</h2>
              <p>Sign in to continue your learning journey.</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <div className="input-icon-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                  <input
                    type="email"
                    className="input"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="input-icon-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 018 0v3" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="input-eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <p className="auth-forgot">
                                <a href="/forgot-password">Forgot password?</a>
              </p>
              <button type="submit" className="btn">Sign In →</button>
            </form>
            <div className="auth-divider">
              <span>OR</span>
            </div>
            <div className="google-btn-wrapper">
              <button
                type="button"
                className="btn btn-google"
                onClick={() => hiddenGoogleBtn.current.querySelector('div[role="button"]').click()}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.6 34.7 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.9l6.6 5.6C39.9 37.6 44 31.9 44 24c0-1.3-.1-2.7-.4-3.5z" />
                </svg>
                Continue with Google
              </button>
              <div ref={hiddenGoogleBtn} className="google-btn-hidden">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed')}
                />
              </div>
            </div>
            <p className="auth-switch">
              Don't have an account? <a href="/register">Sign up</a>
            </p>
            {error && <p className="error-text">{error}</p>}
          </>
        )}
      </div>
      <div className="auth-footer">
        <p className="auth-footer-title">Learn smarter. Prepare better.</p>
        <p className="auth-footer-subtitle">Your AI-powered study companion</p>
        <div className="auth-footer-items">
          <span>📖 Learn</span>
          <span>•</span>
          <span>🧠 Practice</span>
          <span>•</span>
          <span>🎯 Prepare</span>
          <span>•</span>
          <span>⚡ Succeed</span>
        </div>
        <p className="auth-footer-copyright">© 2026 ExamPrep AI. All rights reserved.</p>
      </div>
    </div>
  )
}

export default Login