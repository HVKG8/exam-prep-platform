import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

function CheckEmailNotice({ email, justSent, sendFailed, backLabel, onBack }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState(
    sendFailed ? 'We could not send the email. Please press Resend.' : ''
  )
  const [isError, setIsError] = useState(Boolean(sendFailed))
  const [secondsLeft, setSecondsLeft] = useState(justSent ? 60 : 0)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  async function handleVerify(e) {
    e.preventDefault()
    setMessage('')

    if (code.length !== 6) {
      setIsError(true)
      setMessage('Enter the 6-digit code from your email.')
      return
    }

    setVerifying(true)
    try {
      const response = await axios.post(API_URL + '/api/auth/verify-email', {
        email,
        code,
      })
      localStorage.setItem('token', response.data.token)
      navigate('/dashboard')
    } catch (err) {
      setIsError(true)
      setMessage(
        err.response?.data?.message || 'Verification failed. Please try again.'
      )
      setVerifying(false)
    }
  }

  async function handleResend() {
    setSending(true)
    setMessage('')
    try {
      const response = await axios.post(API_URL + '/api/auth/resend-verification', {
        email,
      })
      setIsError(false)
      setMessage(response.data.message)
      setCode('')
      setSecondsLeft(60)
    } catch (err) {
      setIsError(true)
      setMessage(
        err.response?.data?.message || 'Could not send the email. Please try again.'
      )
    }
    setSending(false)
  }

  return (
    <div className="check-email">
      <div className="check-email-icon">📧</div>
      <h3>Check your email</h3>
      <p>
        We sent a 6-digit code to <strong>{email}</strong>. Enter it below to
        activate your account.
      </p>
      <p className="check-email-hint">
        Can't find it? Look in your <strong>Spam</strong> folder. The code works for
        10 minutes.
      </p>

      <form onSubmit={handleVerify}>
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
        <button type="submit" className="btn" disabled={verifying}>
          {verifying ? 'Verifying...' : 'Verify email'}
        </button>
      </form>

      {message && <p className={isError ? 'error-text' : 'success-text'}>{message}</p>}

      <button
        type="button"
        className="check-email-back"
        onClick={handleResend}
        disabled={sending || secondsLeft > 0}
      >
        {sending
          ? 'Sending...'
          : secondsLeft > 0
          ? `Resend code in ${secondsLeft}s`
          : 'Resend code'}
      </button>
      <button type="button" className="check-email-back" onClick={onBack}>
        {backLabel}
      </button>
    </div>
  )
}

export default CheckEmailNotice