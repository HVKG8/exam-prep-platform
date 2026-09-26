import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './AISolver.css';
import MermaidDiagram from '../components/MermaidDiagram';
import Sidebar from '../components/Sidebar';

// Turns a camelCase key like "advantages" into a readable label "Advantages"
function formatLabel(key) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function answerToPlainText(answer) {
  return Object.entries(answer)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      const label = formatLabel(key);
      const text = Array.isArray(value) ? value.join('\n- ') : value;
      return `${label}:\n${Array.isArray(value) ? '- ' + text : text}`;
    })
    .join('\n\n');
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
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadConversation = async () => {
      if (!selectedConversationId) {
        setMessages([]);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `http://localhost:5000/api/conversations/${selectedConversationId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(res.data.messages);
      } catch (error) {
        console.error(error);
      }
    };
    loadConversation();
  }, [selectedConversationId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Step 1: get the AI answer
      const res = await axios.post(
        'http://localhost:5000/api/ai/solve',
        { question, marks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newAnswer = res.data.answer;

      // Step 2: make sure we have a conversation to save into
      let conversationId = selectedConversationId;
      if (!conversationId) {
        const convRes = await axios.post(
          'http://localhost:5000/api/conversations',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        conversationId = convRes.data._id;
        setSelectedConversationId(conversationId);
      }

      // Step 3: save this question+answer into the conversation
      await axios.post(
        `http://localhost:5000/api/conversations/${conversationId}/messages`,
        { question, marks, answer: newAnswer },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Step 4: show it immediately in the chat
      setMessages([...messages, { question, marks, answer: newAnswer }]);
      setQuestion('');
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (index, answerObj) => {
    navigator.clipboard.writeText(answerToPlainText(answerObj));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
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
    <div style={{ display: 'flex' }}>
            <Sidebar
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
        onNewChat={() => setSelectedConversationId(null)}
        refreshTrigger={refreshTrigger}
      />
      <div style={{ flex: 1 }}>
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

          {messages.length > 0 && (
            <div className="chat-thread">
              {messages.map((msg, index) => (
                <div key={index}>
                  <div className="chat-bubble user-bubble">
                    <p>{msg.question}</p>
                  </div>
                  <div className="chat-bubble assistant-bubble">
                    {Object.entries(msg.answer).map(([key, value]) => (
                      <AnswerSection key={key} label={key} value={value} />
                    ))}
                    <button
                      onClick={() => handleCopy(index, msg.answer)}
                      className="btn-outline copy-btn"
                    >
                      {copiedIndex === index ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AISolver;