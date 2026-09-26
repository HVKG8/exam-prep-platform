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

function formatTime(dateStr) {
  const date = dateStr ? new Date(dateStr) : new Date();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const sectionIcons = {
  introduction: '📝',
  definition: '📘',
  explanation: '💡',
  types: '🗂️',
  advantages: '✅',
  disadvantages: '⚠️',
  applications: '🎯',
  examples: '📄',
  conclusion: '🏁',
};

function AnswerSection({ label, value }) {
  if (value === null || value === undefined || value === '') return null;

  if (label === 'diagram') {
    return (
      <div className="answer-section">
        <h4>
          <span className="answer-section-icon">📊</span>
          {formatLabel(label)}
        </h4>
        <MermaidDiagram chart={value} />
      </div>
    );
  }

  return (
    <div className="answer-section">
      <h4>
        <span className="answer-section-icon">{sectionIcons[label] || '•'}</span>
        {formatLabel(label)}
      </h4>
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
  const chatScrollRef = useRef(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [regeneratingIndex, setRegeneratingIndex] = useState(null);
  const [pendingQuestion, setPendingQuestion] = useState('');

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

  // Auto-scroll to the bottom whenever messages change or a new question is pending
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, pendingQuestion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentQuestion = question.trim();
    if (!currentQuestion) return;

    setPendingQuestion(currentQuestion);
    setQuestion('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Step 1: get the AI answer
      const res = await axios.post(
        'http://localhost:5000/api/ai/solve',
        { question: currentQuestion, marks },
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
        { question: currentQuestion, marks, answer: newAnswer },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Step 4: show it immediately in the chat
      setMessages([
        ...messages,
        { question: currentQuestion, marks, answer: newAnswer, createdAt: new Date().toISOString() },
      ]);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setPendingQuestion('');
    }
  };

  const handleRegenerate = async (index) => {
    const msg = messages[index];
    setRegeneratingIndex(index);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/ai/solve',
        { question: msg.question, marks: msg.marks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = [...messages];
      updated[index] = { ...updated[index], answer: res.data.answer };
      setMessages(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setRegeneratingIndex(null);
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
      <div className="solver-page">
        <div className="solver-header">
          <div className="solver-header-left">
            <div className="solver-bot-avatar">🤖</div>
            <div>
              <h1>AI Tutor</h1>
              <p className="solver-subtitle">Your personal study assistant</p>
            </div>
          </div>
          <div className="solver-header-badge">✨ Ask · Learn · Excel</div>
        </div>

        <div className="solver-chat-scroll" ref={chatScrollRef}>
          {(messages.length > 0 || pendingQuestion) && (
            <div className="chat-thread">
              {messages.map((msg, index) => (
                <div key={index} className="chat-message-group">
                  <div className="chat-row user-row">
                    <div className="chat-bubble user-bubble">
                      <p>{msg.question}</p>
                    </div>
                    <div className="chat-avatar user-avatar">🧑</div>
                  </div>
                  <p className="chat-timestamp user-timestamp">{formatTime(msg.createdAt)}</p>

                  <div className="chat-row assistant-row">
                    <div className="chat-avatar bot-avatar">🤖</div>
                    <div className="chat-bubble assistant-bubble">
                      {Object.entries(msg.answer).map(([key, value]) => (
                        <AnswerSection key={key} label={key} value={value} />
                      ))}
                      <div className="assistant-bubble-footer">
                        <button
                          onClick={() => handleCopy(index, msg.answer)}
                          className="footer-action-btn"
                        >
                          📋 {copiedIndex === index ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={() => handleRegenerate(index)}
                          className="footer-action-btn"
                          disabled={regeneratingIndex === index}
                        >
                          🔄 {regeneratingIndex === index ? 'Regenerating...' : 'Regenerate'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {pendingQuestion && (
                <div className="chat-message-group">
                  <div className="chat-row user-row">
                    <div className="chat-bubble user-bubble">
                      <p>{pendingQuestion}</p>
                    </div>
                    <div className="chat-avatar user-avatar">🧑</div>
                  </div>

                  <div className="chat-row assistant-row">
                    <div className="chat-avatar bot-avatar">🤖</div>
                    <div className="chat-bubble assistant-bubble typing-bubble">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="solver-input-form">
          <div className="marks-bar">
            <span className="marks-bar-label">Marks:</span>
            <div className="marks-chip-group">
              {[2, 5, 10].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`marks-chip ${marks === m ? 'active' : ''}`}
                  onClick={() => setMarks(marks === m ? '' : m)}
                >
                  {m}
                </button>
              ))}
            </div>
            <span className="marks-bar-hint">
              {marks ? `Answer scaled for ${marks} marks` : 'AI will decide the depth'}
            </span>
          </div>

          <div className="solver-input-bar">
            <span className="input-bar-icon">📎</span>
            <textarea
              ref={textareaRef}
              className="solver-input-textarea"
              placeholder="Type your question here..."
              value={question}
              onChange={handleQuestionChange}
              rows={1}
            />
            <button type="submit" className="solver-send-btn" disabled={loading}>
              {loading ? '…' : '➤'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AISolver;