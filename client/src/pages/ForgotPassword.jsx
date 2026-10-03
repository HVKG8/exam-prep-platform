import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config'
import useLightTheme from '../hooks/useLightTheme'
import './Auth.css'

function ForgotPassword() {
  useLightTheme()
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1 = enter email, 2 = enter code + new password
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  function showError(text) {
    setIsError(true)
    setMessage(text)
  }

  async function requestCode() {
    setLoading(true)
    setMessage('')
    try {
      const response = await axios.post(API_URL + '/api/auth/forgot-password', {
        email: email.trim(),
      })
      setIsError(false)
      setMessage(response.data.message)
      setCode('')
      setStep(2)
      setSecondsLeft(60)
    } catch (err) {
      showError(
        err.response?.data?.message || 'Could not send the code. Please try again.'
      )
    }
    setLoading(false)
  }

  function handleEmailSubmit(e) {
    e.preventDefault()
    if (!email.trim()) {
      showError('Enter your email address.')
      return
    }
    requestCode()
  }

  async function handleReset(e) {
    e.preventDefault()
    setMessage('')

    if (code.length !== 6) {
      showError('Enter the 6-digit code from your email.')
      return
    }
    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(API_URL + '/api/auth/reset-password', {
        email: email.trim(),
        code,
        newPassword,
      })
      localStorage.setItem('token', response.data.token)
      navigate('/dashboard')
    } catch (err) {
      showError(
        err.response?.data?.message || 'Could not reset the password. Please try again.'
      )
      setLoading(false)
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
        {step === 1 ? (
          <>
            <div className="auth-heading">
              <h2>Forgot password?</h2>
              <p>Enter your email and we will send you a 6-digit code.</p>
            </div>
            <form onSubmit={handleEmailSubmit}>
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
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send code →'}
              </button>
            </form>
            {message && <p className={isError ? 'error-text' : 'success-text'}>{message}</p>}
            <p className="auth-switch">
              Remembered it? <a href="/login">Sign in</a>
            </p>
          </>
        ) : (
          <div className="check-email">
            <div className="check-email-icon">🔑</div>
            <h3>Reset your password</h3>
            <p>
              We sent a 6-digit code to <strong>{email.trim()}</strong>, if an account
              exists for it.
            </p>
            <p className="check-email-hint">
              Can't find it? Look in your <strong>Spam</strong> folder. The code works
              for 10 minutes.
            </p>

            <form onSubmit={handleReset}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="otp-input"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
              <div className="form-group">
                <div className="input-icon-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 018 0v3" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                <div className="input-icon-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 018 0v3" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Please wait...' : 'Reset password'}
              </button>
            </form>

            {message && <p className={isError ? 'error-text' : 'success-text'}>{message}</p>}

            <button
              type="button"
              className="check-email-back"
              onClick={requestCode}
              disabled={loading || secondsLeft > 0}
            >
              {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
            </button>
            <button
              type="button"
              className="check-email-back"
              onClick={() => {
                setStep(1)
                setMessage('')
              }}
            >
              ← Use a different email
            </button>
          </div>
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

export default ForgotPassword