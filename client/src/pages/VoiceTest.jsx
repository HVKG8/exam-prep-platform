import useSpeech from "../hooks/useSpeech";

export default function VoiceTest() {
  const {
    supported,
    listening,
    text,
    interim,
    error,
    restarts,
    lastEvent,
    start,
    stop,
    setText,
  } = useSpeech("en-IN");

  const speak = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      "Hello! I am your viva examiner. Are you ready?"
    );
    u.lang = "en-IN";
    window.speechSynthesis.speak(u);
  };

  const btn = {
    padding: "12px 16px",
    fontSize: 16,
    marginRight: 8,
    marginBottom: 8,
    cursor: "pointer",
  };

  return (
    <div style={{ padding: 20, maxWidth: 520, margin: "0 auto" }}>
      <h2>Voice Test</h2>

      {!supported && (
        <p style={{ color: "red" }}>
          Voice is not supported here. Open in Chrome, or type your answer below.
        </p>
      )}

      <button onClick={speak} style={btn}>🔊 Hear the examiner</button>

      <div>
        {!listening ? (
          <button onClick={start} style={btn} disabled={!supported}>
            🎤 Start / Continue
          </button>
        ) : (
          <button onClick={stop} style={btn}>⏹️ Stop</button>
        )}
        <button onClick={() => setText("")} style={btn}>🗑️ Clear</button>
      </div>

      <p>
        {listening
          ? "🎙️ Listening... take your time, tap Stop when finished."
          : text
          ? "⏸️ Paused. Tap Start / Continue to add more."
          : "Tap Start and speak."}
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="Your spoken answer appears here. You can also type or fix words."
        style={{ width: "100%", padding: 10, fontSize: 16, boxSizing: "border-box" }}
      />

      <p style={{ color: "#888" }}>Hearing: {interim || "..."}</p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p style={{ fontSize: 12, color: "#888" }}>
        Debug: last event = {lastEvent} · auto-resumed {restarts} times
      </p>
    </div>
  );
}