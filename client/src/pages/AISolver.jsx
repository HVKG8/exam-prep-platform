import { API_URL } from '../config'
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './AISolver.css';
import MermaidDiagram from '../components/MermaidDiagram';
import MarkdownAnswer from '../components/MarkdownAnswer';
import Sidebar from '../components/Sidebar';

const MAX_QUESTION_LENGTH = 1000;
const SHOW_COUNTER_FROM = 800;
const FENCE = '`'.repeat(3);

// Quick follow-up buttons shown under the last answer
const FOLLOW_UPS = [
  { icon: '🧒', label: 'Explain simpler', text: 'Explain simpler' },
  { icon: '💡', label: 'Give an example', text: 'Give an example' },
  { icon: '📝', label: 'Summarize in 3 lines', text: 'Summarize this in 3 lines' },
];

// Turns a camelCase key like "advantages" into a readable label "Advantages"
function formatLabel(key) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function answerToPlainText(answer) {
  if (answer.markdown) return answer.markdown;
  return Object.entries(answer)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      const label = formatLabel(key);
      const text = Array.isArray(value) ? value.join('\n- ') : value;
      return `${label}:\n${Array.isArray(value) ? '- ' + text : text}`;
    })
    .join('\n\n');
}

// The last few messages, sent along so the AI understands follow-up questions
function buildHistory(list) {
  return list.slice(-4).map((m) => ({
    question: m.question,
    answer: answerToPlainText(m.answer).slice(0, 1500),
  }));
}

// While the answer is still being written, a half-finished diagram cannot be drawn.
// So we hide it until its closing fence arrives.
function prepareStreamingText(text) {
  const fenceCount = text.split(FENCE).length - 1;
  if (fenceCount % 2 === 1) {
    const idx = text.lastIndexOf(FENCE);
    const rest = text.slice(idx + FENCE.length).trimStart().toLowerCase();
    if (rest.startsWith('mermaid') || rest === '' || 'mermaid'.startsWith(rest)) {
      return text.slice(0, idx) + '\n\n*Drawing diagram…*';
    }
  }
  return text;
}

function formatTime(dateStr) {
  const date = dateStr ? new Date(dateStr) : new Date();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Picks a clear message for the student from whatever went wrong
function getErrorMessage(err) {
  if (!err.response) {
    return 'Could not reach the server. It may be waking up, so please wait a few seconds and try again.';
  }
  const status = err.response.status;
  const serverMessage = err.response.data?.message;
  if ((status === 400 || status === 429 || status === 503) && serverMessage) {
    return serverMessage;
  }
  return 'Something went wrong. Please try again in a moment.';
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

// Fixed display order, so the conclusion always comes last
const sectionOrder = [
  'introduction', 'definition', 'diagram', 'explanation', 'types',
  'advantages', 'disadvantages', 'applications', 'examples', 'conclusion',
];

function sortedEntries(answer) {
  return Object.entries(answer).sort(([a], [b]) => {
    const ia = sectionOrder.indexOf(a);
    const ib = sectionOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

function AnswerSection({ label, value, question }) {
  if (value === null || value === undefined || value === '') return null;

  if (label === 'diagram') {
    return (
      <div className="answer-section">
        <h4>
          <span className="answer-section-icon">📊</span>
          {formatLabel(label)}
        </h4>
        <MermaidDiagram chart={value} title={question} />
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
        <p style={{ whiteSpace: 'pre-line' }}>{value}</p>
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
  const [streamingText, setStreamingText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const tooLong = question.length > MAX_QUESTION_LENGTH;

  useEffect(() => {
    const loadConversation = async () => {
      if (!selectedConversationId) {
        setMessages([]);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          API_URL + `/api/conversations/${selectedConversationId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(res.data.messages);
      } catch (error) {
        console.error(error);
      }
    };
    loadConversation();
  }, [selectedConversationId]);

  // Auto-scroll to the bottom whenever messages change, a question is pending, or text is streaming in
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, pendingQuestion, streamingText]);

  // Sends a question to the AI and shows the answer as it is written.
  // fromInput = true when the text came from the typing box (so we can put it back if it fails).
  const sendQuestion = async (text, marksValue, fromInput) => {
    const currentQuestion = text.trim();
    if (!currentQuestion || loading) return;

    if (currentQuestion.length > MAX_QUESTION_LENGTH) {
      setErrorMessage(
        `Your question is too long. Please keep it under ${MAX_QUESTION_LENGTH} characters.`
      );
      return;
    }

    setErrorMessage('');
    setPendingQuestion(currentQuestion);
    setStreamingText('');
    if (fromInput) {
      setQuestion('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Step 1: get the AI answer, piece by piece
      const res = await fetch(API_URL + '/api/ai/solve-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: currentQuestion,
          marks: marksValue,
          history: buildHistory(messages),
        }),
      });

      if (!res.ok) {
        let data = {};
        try {
          data = await res.json();
        } catch (parseErr) {
          // the server did not send JSON, so we use the generic message
        }
        const failure = new Error('Request failed');
        failure.response = { status: res.status, data };
        throw failure;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';
      let newAnswer = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop();

        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith('data:')) continue;
          const data = JSON.parse(line.slice(5).trim());

          if (data.type === 'chunk') {
            full += data.text;
            setStreamingText(full);
          } else if (data.type === 'done') {
            newAnswer = data.answer;
          } else if (data.type === 'error') {
            const failure = new Error(data.message);
            failure.response = { status: 503, data: { message: data.message } };
            throw failure;
          }
        }
      }

      if (!newAnswer) {
        const failure = new Error('The answer did not finish');
        failure.response = { status: 500, data: {} };
        throw failure;
      }

      // Step 2: make sure we have a conversation to save into
      let conversationId = selectedConversationId;
      if (!conversationId) {
        const convRes = await axios.post(
          API_URL + '/api/conversations',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        conversationId = convRes.data._id;
        setSelectedConversationId(conversationId);
      }

      // Step 3: save this question+answer into the conversation
      await axios.post(
        API_URL + `/api/conversations/${conversationId}/messages`,
        { question: currentQuestion, marks: marksValue, answer: newAnswer },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Step 4: show it in the chat
      setMessages([
        ...messages,
        {
          question: currentQuestion,
          marks: marksValue,
          answer: newAnswer,
          createdAt: new Date().toISOString(),
        },
      ]);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      setErrorMessage(getErrorMessage(err));
      if (fromInput) setQuestion(currentQuestion);
    } finally {
      setLoading(false);
      setPendingQuestion('');
      setStreamingText('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuestion(question, marks, true);
  };

  const handleRegenerate = async (index) => {
    const msg = messages[index];
    setErrorMessage('');
    setRegeneratingIndex(index);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        API_URL + '/api/ai/solve',
        {
          question: msg.question,
          marks: msg.marks,
          history: buildHistory(messages.slice(0, index)),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newAnswer = res.data.answer;

      const updated = [...messages];
      updated[index] = { ...updated[index], answer: newAnswer };
      setMessages(updated);

      // Save the new answer, so it is still there after a reload
      try {
        await axios.patch(
          API_URL + `/api/conversations/${selectedConversationId}/messages/${index}`,
          { answer: newAnswer },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (saveErr) {
        console.error(saveErr);
        setErrorMessage(
          'The new answer is shown, but it could not be saved. It may disappear when you reload.'
        );
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(getErrorMessage(err));
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
    <div className="solver-layout">
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
                      {msg.answer?.markdown ? (
                        <MarkdownAnswer
                          text={msg.answer.markdown}
                          question={msg.question}
                        />
                      ) : (
                        sortedEntries(msg.answer).map(([key, value]) => (
                          <AnswerSection
                            key={key}
                            label={key}
                            value={value}
                            question={msg.question}
                          />
                        ))
                      )}
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

                      {index === messages.length - 1 && !loading && (
                        <div className="followup-row">
                          {FOLLOW_UPS.map((f) => (
                            <button
                              key={f.label}
                              type="button"
                              className="followup-chip"
                              onClick={() => sendQuestion(f.text, '', false)}
                            >
                              {f.icon} {f.label}
                            </button>
                          ))}
                        </div>
                      )}
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
                    {streamingText ? (
                      <div className="chat-bubble assistant-bubble">
                        <MarkdownAnswer
                          text={prepareStreamingText(streamingText)}
                          question={pendingQuestion}
                        />
                      </div>
                    ) : (
                      <div className="chat-bubble assistant-bubble typing-bubble">
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {errorMessage && <div className="solver-error">{errorMessage}</div>}

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
            <button type="submit" className="solver-send-btn" disabled={loading || tooLong}>
              {loading ? '…' : '➤'}
            </button>
          </div>

          {question.length >= SHOW_COUNTER_FROM && (
            <div className={`char-counter ${tooLong ? 'over' : ''}`}>
              {question.length} / {MAX_QUESTION_LENGTH}
              {tooLong && ' · too long, please shorten your question'}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default AISolver;