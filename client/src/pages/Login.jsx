import { API_URL } from '../config'
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import useLightTheme from '../hooks/useLightTheme'
import CheckEmailNotice from '../components/CheckEmailNotice'
import './Auth.css'
import Logo from '../components/Logo'

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
  const googleWrapRef = useRef(null)
  const [googleWidth, setGoogleWidth] = useState(280)

  // Google's button needs a width in pixels, so match the card on small phones
  useEffect(() => {
    if (googleWrapRef.current) {
      const available = googleWrapRef.current.offsetWidth
      setGoogleWidth(Math.max(200, Math.min(400, Math.floor(available))))
    }
  }, [])

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
        <Logo size={44} />
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
            <div className="google-official-btn" ref={googleWrapRef}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed')}
                text="continue_with"
                shape="rectangular"
                theme="outline"
                size="large"
                width={String(googleWidth)}
              />
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