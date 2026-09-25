import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

function History() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/ai/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(res.data);
      } catch (err) {
        setError('Could not load history');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div>
      <Navbar />
      <h2>My Question History</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && history.length === 0 && <p>You haven't asked any questions yet.</p>}

      {history.map((h) => (
        <div key={h._id} style={{ border: '1px solid #ccc', padding: '10px', marginTop: '10px' }}>
          <p><strong>Question ({h.marks} marks):</strong> {h.question}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}><strong>Answer:</strong> {h.answer}</p>
          <p style={{ fontSize: '0.8em', color: '#666' }}>
            {new Date(h.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

export default History;