import { API_URL } from '../config'
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import useLightTheme from '../hooks/useLightTheme'
import CheckEmailNotice from '../components/CheckEmailNotice'
import './Auth.css'

// Server messages that belong under the email box (not at the bottom of the card)
const EMAIL_MESSAGE = /(valid email|did you mean|email domain|already registered|google sign-in)/i

function Register() {
  useLightTheme()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [pending, setPending] = useState(null) // { email, sendFailed } after signing up
  const navigate = useNavigate()
  const googleWrapRef = useRef(null)
  const [googleWidth, setGoogleWidth] = useState(280)

  // "Did you mean name@gmail.com?" -> name@gmail.com (or null)
  const suggestion = (emailError.match(/Did you mean (\S+)\?/) || [])[1] || null

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
    setEmailError('')

    const cleanEmail = email.trim()

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy')
      return
    }

    try {
      const response = await axios.post(API_URL + '/api/auth/register', {
        name,
        email: cleanEmail,
        password,
      })
      setPending({
        email: response.data.email || cleanEmail,
        sendFailed: response.data.emailSent === false,
      })
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed'
      if (EMAIL_MESSAGE.test(message)) {
        setEmailError(message)
      } else {
        setError(message)
      }
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    try {
      setError('')
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
        {pending ? (
          <CheckEmailNotice
            email={pending.email}
            justSent={!pending.sendFailed}
            sendFailed={pending.sendFailed}
            backLabel="Wrong email? Change it"
            onBack={() => setPending(null)}
          />
        ) : (
          <>
            <div className="auth-heading">
              <h2>Create an account</h2>
              <p>Start your learning journey with our AI-powered study assistant.</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <div className="input-icon-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                  </svg>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
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
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError('')
                    }}
                  />
                </div>
                {emailError && (
                  <p className="error-text" style={{ marginTop: 6 }}>
                    {emailError}
                    {suggestion && (
                      <>
                        {' '}
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(suggestion)
                            setEmailError('')
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: '#4f46e5',
                            fontWeight: 600,
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            font: 'inherit',
                          }}
                        >
                          Use {suggestion}
                        </button>
                      </>
                    )}
                  </p>
                )}
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
                    placeholder="Create a password"
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
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-icon-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 018 0v3" />
                  </svg>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="input-eye-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="form-group form-group-checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <span>
                    I agree to the{' '}
                    <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and{' '}
                    <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>
                  </span>
                </label>
              </div>
              <button type="submit" className="btn">Create Account →</button>
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
              Already have an account? <a href="/login">Sign in</a>
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

export default Register