import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import Sidebar from '../components/Sidebar';
import useSpeech from '../hooks/useSpeech';
import './Viva.css';

const READINESS = {
  needs_practice: { label: 'Needs practice', cls: 'needs' },
  getting_there: { label: 'Getting there', cls: 'getting' },
  strong: { label: 'Strong', cls: 'strong' },
};

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

// The examiner speaks out loud using the browser's built-in voice.
function speak(text) {
  if (!text || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-IN';
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

function FeedbackCard({ fb }) {
  const r = READINESS[fb.readiness] || READINESS.getting_there;
  return (
    <div className="viva-feedback">
      <span className={`viva-chip ${r.cls}`}>{r.label}</span>

      {fb.wentWell && (
        <div className="viva-fb-block">
          <h4>✅ What went well</h4>
          <p>{fb.wentWell}</p>
        </div>
      )}

      {fb.toAdd && fb.toAdd.length > 0 && (
        <div className="viva-fb-block">
          <h4>➕ What to add</h4>
          <ul>
            {fb.toAdd.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {fb.betterAnswer && (
        <div className="viva-fb-block">
          <h4>💬 A better way to say it</h4>
          <p>{fb.betterAnswer}</p>
          <button className="viva-link-btn" onClick={() => speak(fb.betterAnswer)}>
            🔊 Listen, then repeat it aloud
          </button>
        </div>
      )}
    </div>
  );
}

function Viva() {
  const [view, setView] = useState('setup'); // setup | session | summary
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [past, setPast] = useState([]);

  const [starting, setStarting] = useState(false);
  const [session, setSession] = useState(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('question'); // question | feedback | followup | followupFeedback
  const [feedback, setFeedback] = useState(null);
  const [followFeedback, setFollowFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState('');

  const { supported, listening, text, interim, error: voiceError, start, stop, setText } =
    useSpeech('en-IN');

  const refreshPast = async () => {
    try {
      const res = await axios.get(API_URL + '/api/viva', authConfig());
      setPast(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(API_URL + '/api/subjects', authConfig());
        setSubjects(res.data);
      } catch (err) {
        console.error(err);
        setError('Could not load subjects. Please refresh the page.');
      }
      try {
        const res = await axios.get(API_URL + '/api/topics', authConfig());
        setTopics(res.data);
      } catch (err) {
        console.error(err);
      }
      refreshPast();
    };
    load();
  }, []);

  // stop the examiner's voice when leaving the page
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const currentItem = session ? session.items[index] : null;

  // the examiner reads each question aloud
  useEffect(() => {
    if (view !== 'session' || !currentItem) return;
    if (phase === 'question') speak(currentItem.question);
    if (phase === 'followup' && feedback && feedback.followUp) speak(feedback.followUp);
  }, [view, index, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const topicsForSubject = topics.filter(
    (t) => (t.subject && t.subject._id ? t.subject._id : t.subject) === subjectId
  );

  const beginSession = (s) => {
    setSession(s);
    setIndex(0);
    setPhase('question');
    setFeedback(null);
    setFollowFeedback(null);
    setText('');
    setError('');
    setView('session');
  };

  const handleStart = async () => {
    const subject = subjects.find((s) => s._id === subjectId);
    if (!subject) {
      setError('Please choose a subject first.');
      return;
    }
    const topic = topics.find((t) => t._id === topicId);
    setError('');
    setStarting(true);
    try {
      const res = await axios.post(
        API_URL + '/api/viva/start',
        { subject: subject.name, topic: topic ? topic.title : '' },
        authConfig()
      );
      beginSession(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start the viva. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  const handleStop = () => {
    stop();
    setSettling(true); // give the last spoken words a moment to appear
    setTimeout(() => setSettling(false), 1200);
  };

  const handleSubmit = async (isFollowUp, forcedAnswer) => {
    const answer = (forcedAnswer || text).trim();
    if (!answer) return;
    stop();
    setError('');
    setSubmitting(true);
    try {
      const res = await axios.post(
        API_URL + `/api/viva/${session._id}/answer`,
        { itemIndex: index, isFollowUp: !!isFollowUp, answer },
        authConfig()
      );
      const fb = res.data.feedback;

      // keep our copy of the session up to date
      setSession({
        ...session,
        items: session.items.map((it, i) => {
          if (i !== index) return it;
          return isFollowUp
            ? { ...it, followUpAnswer: answer, followUpFeedback: fb }
            : { ...it, answer, attempts: res.data.attempts, feedback: fb };
        }),
      });

      if (isFollowUp) {
        setFollowFeedback(fb);
        setPhase('followupFeedback');
      } else {
        setFeedback(fb);
        setPhase('feedback');
      }
      setText('');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Something went wrong. Your answer is still here, please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setText('');
    setError('');
    setPhase('question');
  };

  const goFollowUp = () => {
    setText('');
    setError('');
    setFollowFeedback(null);
    setPhase('followup');
  };

  const handleFinish = async () => {
    stop();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setError('');
    setSubmitting(true);
    try {
      const res = await axios.post(
        API_URL + `/api/viva/${session._id}/finish`,
        {},
        authConfig()
      );
      setSession(res.data);
      setView('summary');
      refreshPast();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not finish the viva.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (index >= session.items.length - 1) {
      handleFinish();
      return;
    }
    setIndex(index + 1);
    setPhase('question');
    setFeedback(null);
    setFollowFeedback(null);
    setText('');
    setError('');
  };

  const openPast = async (id) => {
    setError('');
    try {
      const res = await axios.get(API_URL + `/api/viva/${id}`, authConfig());
      setSession(res.data);
      setView('summary');
    } catch (err) {
      setError('Could not open that session.');
    }
  };

  const resetToSetup = () => {
    setView('setup');
    setSession(null);
    setText('');
    setError('');
    refreshPast();
  };

  /* ---------------- SETUP ---------------- */
  const renderSetup = () => (
    <>
      <h1 className="viva-title">🎤 Viva Prep</h1>
      <p className="viva-subtitle">
        Practise answering out loud, the way you will in a real viva. The examiner asks, you
        speak, and you get friendly feedback.
      </p>

      <div className="viva-card">
        <label className="viva-label">Subject</label>
        <select
          className="input viva-select"
          value={subjectId}
          onChange={(e) => {
            setSubjectId(e.target.value);
            setTopicId('');
          }}
        >
          <option value="">Choose a subject</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        {subjectId && topicsForSubject.length > 0 && (
          <>
            <label className="viva-label">Topic (optional)</label>
            <select
              className="input viva-select"
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
            >
              <option value="">Any topic from this subject</option>
              {topicsForSubject.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>
          </>
        )}

        <button
          className="btn viva-primary-btn"
          onClick={handleStart}
          disabled={starting || !subjectId}
        >
          {starting ? 'The examiner is preparing your questions…' : 'Start Viva'}
        </button>

        {error && <p className="error-text">{error}</p>}

        {!supported && (
          <p className="viva-note">
            Voice answers need Chrome or Edge. In this browser you can type your answers.
          </p>
        )}
        <p className="viva-note">
          Practice only. The AI can make mistakes, so check important answers in your notes.
        </p>
      </div>

      {past.length > 0 && (
        <div className="viva-past">
          <h2 className="viva-section-title">Your past sessions</h2>
          {past.map((p) => {
            const r = READINESS[p.readiness] || READINESS.getting_there;
            return (
              <button key={p._id} className="viva-past-item" onClick={() => openPast(p._id)}>
                <div>
                  <p className="viva-past-title">
                    {p.subject}
                    {p.topic ? ` · ${p.topic}` : ''}
                  </p>
                  <p className="viva-past-meta">
                    {new Date(p.createdAt).toLocaleDateString()} · {p.answeredCount}/
                    {p.totalQuestions} answered
                  </p>
                </div>
                {p.status === 'finished' ? (
                  <span className={`viva-chip ${r.cls}`}>{r.label}</span>
                ) : (
                  <span className="viva-chip unfinished">Not finished</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );

  /* ---------------- SESSION ---------------- */
  const renderSession = () => {
    const total = session.items.length;
    const item = session.items[index];
    const isLast = index === total - 1;
    const answering = phase === 'question' || phase === 'followup';
    const isFollowUp = phase === 'followup';
    const questionText = isFollowUp ? feedback.followUp : item.question;
    const progressPct = Math.round(((index + (phase !== 'question' ? 1 : 0)) / total) * 100);
    const canSubmit = text.trim() && !listening && !settling && !submitting;

    return (
      <>
        <div className="viva-session-top">
          <span className="viva-qcount">
            Question {index + 1} of {total}
          </span>
          <button className="viva-link-btn" onClick={handleFinish} disabled={submitting}>
            End viva
          </button>
        </div>
        <div className="viva-progress">
          <div className="viva-progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="viva-note viva-meta">
          {session.subject}
          {session.topic ? ` · ${session.topic}` : ''}
        </p>

        {answering && (
          <>
            <div className="viva-examiner">
              <div className="viva-examiner-label">
                {isFollowUp ? 'Follow-up question' : 'Examiner asks'}
              </div>
              <p className="viva-question">{questionText}</p>
              <button className="viva-link-btn" onClick={() => speak(questionText)}>
                🔊 Hear it again
              </button>
            </div>

            <div className="viva-card">
              {!listening ? (
                <button
                  className="viva-mic-btn"
                  onClick={start}
                  disabled={!supported || submitting}
                >
                  🎤 {text ? 'Continue speaking' : 'Start speaking'}
                </button>
              ) : (
                <button className="viva-mic-btn listening" onClick={handleStop}>
                  ⏹️ Stop
                </button>
              )}

              <p className="viva-status">
                {listening
                  ? '🎙️ Listening… take your time, tap Stop when you finish.'
                  : settling
                  ? 'Getting your last words…'
                  : supported
                  ? 'Tap the mic and answer out loud. You can also type below.'
                  : 'Voice is not available here. Please type your answer below.'}
              </p>

              <textarea
                className="viva-textarea"
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Your spoken answer appears here. You can fix words or type."
              />
              {interim && <p className="viva-hearing">Hearing: {interim}</p>}
              {voiceError && <p className="error-text">{voiceError}</p>}
              {error && <p className="error-text">{error}</p>}

              <div className="viva-actions">
                <button
                  className="btn viva-primary-btn"
                  onClick={() => handleSubmit(isFollowUp)}
                  disabled={!canSubmit}
                >
                  {submitting ? 'The examiner is thinking…' : 'Submit answer'}
                </button>
                <button
                  className="viva-secondary-btn"
                  onClick={() =>
                    handleSubmit(isFollowUp, 'I do not know this one. Please teach me.')
                  }
                  disabled={submitting || listening}
                >
                  🤷 I don't know, teach me
                </button>
              </div>
              <p className="viva-note">
                Tip: speak in short, clear sentences and wait a moment before tapping Stop.
              </p>
            </div>
          </>
        )}

        {phase === 'feedback' && feedback && (
          <>
            <details className="viva-your-answer">
              <summary>Your answer</summary>
              <p>{item.answer}</p>
            </details>
            <FeedbackCard fb={feedback} />
            {error && <p className="error-text">{error}</p>}
            <div className="viva-actions">
              {feedback.followUp ? (
                <button className="btn viva-primary-btn" onClick={goFollowUp}>
                  Follow-up question →
                </button>
              ) : null}
              <button className="viva-secondary-btn" onClick={handleTryAgain}>
                🔁 Try this question again
              </button>
              <button
                className="viva-secondary-btn"
                onClick={handleNext}
                disabled={submitting}
              >
                {isLast ? 'Finish viva' : 'Next question'}
              </button>
            </div>
          </>
        )}

        {phase === 'followupFeedback' && followFeedback && (
          <>
            <FeedbackCard fb={followFeedback} />
            {error && <p className="error-text">{error}</p>}
            <div className="viva-actions">
              <button
                className="btn viva-primary-btn"
                onClick={handleNext}
                disabled={submitting}
              >
                {isLast ? 'Finish viva' : 'Next question →'}
              </button>
            </div>
          </>
        )}
      </>
    );
  };

  /* ---------------- SUMMARY ---------------- */
  const renderSummary = () => {
    const total = session.items.length;
    const answered = session.items.filter((i) => i.answer).length;
    const r = READINESS[session.readiness] || READINESS.getting_there;

    return (
      <>
        <h1 className="viva-title">Viva summary</h1>
        <p className="viva-subtitle">
          {session.subject}
          {session.topic ? ` · ${session.topic}` : ''} ·{' '}
          {new Date(session.createdAt).toLocaleDateString()}
        </p>

        <div className="viva-card">
          <div>
            {session.status === 'finished' ? (
              <span className={`viva-chip big ${r.cls}`}>{r.label}</span>
            ) : (
              <span className="viva-chip big unfinished">Not finished</span>
            )}
          </div>
          <p className="viva-summary-count">
            Answered {answered} of {total} questions
          </p>
          {answered < total && answered > 0 && (
            <p className="viva-note">
              This level is based only on the {answered} question{answered === 1 ? '' : 's'}{' '}
              you answered.
            </p>
          )}
        </div>

        <h2 className="viva-section-title">Question by question</h2>
        {session.items.map((it, i) => {
          const ir = it.feedback ? READINESS[it.feedback.readiness] || READINESS.getting_there : null;
          return (
            <details key={it._id || i} className="viva-summary-item">
              <summary>
                <span className="viva-summary-q">
                  {i + 1}. {it.question}
                </span>
                {ir ? (
                  <span className={`viva-chip ${ir.cls}`}>{ir.label}</span>
                ) : (
                  <span className="viva-chip unfinished">Not answered</span>
                )}
              </summary>

              {it.feedback ? (
                <>
                  <FeedbackCard fb={it.feedback} />
                  {it.followUpFeedback && (
                    <>
                      <p className="viva-subq">Follow-up: {it.feedback.followUp}</p>
                      <FeedbackCard fb={it.followUpFeedback} />
                    </>
                  )}
                </>
              ) : (
                <p className="viva-note viva-skipped">You did not answer this one.</p>
              )}
            </details>
          );
        })}

        {error && <p className="error-text">{error}</p>}
        <div className="viva-actions">
          <button className="btn viva-primary-btn" onClick={resetToSetup}>
            Start a new viva
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-container viva-page">
        {view === 'setup' && renderSetup()}
        {view === 'session' && session && renderSession()}
        {view === 'summary' && session && renderSummary()}
      </div>
    </div>
  );
}

export default Viva;