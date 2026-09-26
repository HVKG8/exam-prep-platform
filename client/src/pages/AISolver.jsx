import { useState , useRef } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './AISolver.css';
import MermaidDiagram from '../components/MermaidDiagram';

// Turns a camelCase key like "advantages" into a readable label "Advantages"
function formatLabel(key) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function AnswerSection({ label, value }) {
  if (value === null || value === undefined || value === '') return null;

  if (label === 'diagram') {
    return (
      <div className="answer-section">
        <h4>{formatLabel(label)}</h4>
        <MermaidDiagram chart={value} />
      </div>
    );
  }

  return (
    <div className="answer-section">
      <h4>{formatLabel(label)}</h4>
      {Array.isArray(value) ? (
        <ul>
          {value.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{value}</p>
      )}
    </div>
  );
}

function AISolver() {
  const [question, setQuestion] = useState('');
  const [marks, setMarks] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAnswer(null);

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
      setAnswer({ explanation: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (e) => {
  setQuestion(e.target.value);
  const textarea = textareaRef.current;
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
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
                ref={textareaRef}
                className="input"
                value={question}
                onChange={handleQuestionChange}
                rows={2}
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
            {Object.entries(answer).map(([key, value]) => (
              <AnswerSection key={key} label={key} value={value} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AISolver;