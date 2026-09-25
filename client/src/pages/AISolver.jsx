import { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './AISolver.css';

function AISolver() {
  const [question, setQuestion] = useState('');
  const [marks, setMarks] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAnswer('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/ai/solve',
        { question, marks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnswer(res.data.answer);
    } catch (err) {
      console.error(err);
      setAnswer('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <h1>AI Solver</h1>
        <div className="card solver-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Question</label>
              <textarea
                className="input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
              />
            </div>
            <div className="form-group marks-group">
              <label>Marks</label>
              <input
                type="number"
                className="input"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
              />
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Solving...' : 'Get Answer'}
            </button>
          </form>
        </div>

        {answer && (
          <div className="card answer-box">
            <h3>Answer</h3>
            <p>{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AISolver;