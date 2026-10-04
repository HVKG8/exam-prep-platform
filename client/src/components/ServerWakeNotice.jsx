import { useEffect, useState } from 'react'
import { API_URL } from '../config'

const SHOW_AFTER_MS = 2500 // only show the notice if the server is slower than this
const SLOW_AFTER_MS = 30000 // change the message if it is taking very long
const RETRY_EVERY_MS = 3000
const GIVE_UP_AFTER_MS = 120000

function ServerWakeNotice() {
  const [status, setStatus] = useState('idle') // idle | waking | slow | failed

  useEffect(() => {
    let cancelled = false
    let awake = false
    const startedAt = Date.now()

    const showTimer = setTimeout(() => {
      if (!awake && !cancelled) setStatus('waking')
    }, SHOW_AFTER_MS)

    const slowTimer = setTimeout(() => {
      if (!awake && !cancelled) setStatus('slow')
    }, SLOW_AFTER_MS)

    async function ping() {
      while (!cancelled && !awake) {
        const controller = new AbortController()
        const abortTimer = setTimeout(() => controller.abort(), 20000)
        try {
          // Any answer at all means the server is awake
          await fetch(API_URL + '/', { signal: controller.signal, cache: 'no-store' })
          awake = true
          if (!cancelled) setStatus('idle')
        } catch (err) {
          // Server is still asleep. Try again shortly.
        }
        clearTimeout(abortTimer)

        if (awake || cancelled) return

        if (Date.now() - startedAt > GIVE_UP_AFTER_MS) {
          setStatus('failed')
          setTimeout(() => {
            if (!cancelled) setStatus('idle')
          }, 10000)
          return
        }

        await new Promise((resolve) => setTimeout(resolve, RETRY_EVERY_MS))
      }
    }

    ping()

    return () => {
      cancelled = true
      clearTimeout(showTimer)
      clearTimeout(slowTimer)
    }
  }, [])

  if (status === 'idle') return null

  const messages = {
    waking: '⏳ Waking up the server… the first visit can take up to a minute.',
    slow: '⏳ Still waking up… almost there. Thanks for waiting.',
    failed: '⚠️ The server is not responding. Please refresh in a minute.',
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 12px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 420,
          background: '#fef3c7',
          color: '#78350f',
          border: '1px solid #fcd34d',
          borderRadius: 14,
          padding: '8px 14px',
          fontSize: 13,
          lineHeight: 1.35,
          textAlign: 'center',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
        }}
      >
        {messages[status]}
      </div>
    </div>
  )
}

export default ServerWakeNotice