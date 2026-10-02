import { useEffect, useState } from 'react';
import { API_URL } from '../config';

// Shows a friendly message if the server takes more than 3 seconds to answer
// (the free Render server goes to sleep when nobody is using it).
function ServerWakeNotice() {
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) setWaking(true);
    }, 3000);

    fetch(API_URL + '/')
      .catch(() => {})
      .finally(() => {
        finished = true;
        clearTimeout(timer);
        setWaking(false);
      });

    return () => {
      finished = true;
      clearTimeout(timer);
    };
  }, []);

  if (!waking) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 3000,
        maxWidth: '90vw',
        background: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fcd34d',
        borderRadius: 12,
        padding: '10px 16px',
        fontSize: 14,
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      ⏳ Waking up the server… the first visit can take up to a minute. Please wait.
    </div>
  );
}

export default ServerWakeNotice;