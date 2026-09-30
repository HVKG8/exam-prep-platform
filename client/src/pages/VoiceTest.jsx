import { useState, useRef } from "react";

export default function VoiceTest() {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const recRef = useRef(null);

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  const start = () => {
    if (!SR) {
      setError("Voice is not supported in this browser.");
      return;
    }
    setError("");
    setText("");
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) {
        t += e.results[i][0].transcript;
      }
      setText(t);
    };
    rec.onerror = (e) => setError("Error: " + e.error);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const stop = () => {
    if (recRef.current) recRef.current.stop();
  };

  const speak = () => {
    const u = new SpeechSynthesisUtterance(
      "Hello! I am your viva examiner. Are you ready?"
    );
    u.lang = "en-IN";
    window.speechSynthesis.speak(u);
  };

  return (
    <div style={{ padding: 24, maxWidth: 500, margin: "0 auto" }}>
      <h2>Voice Test</h2>

      <button onClick={speak} style={{ padding: 12, marginBottom: 16 }}>
        🔊 Hear the examiner
      </button>

      <div>
        {!listening ? (
          <button onClick={start} style={{ padding: 12 }}>
            🎤 Start speaking
          </button>
        ) : (
          <button onClick={stop} style={{ padding: 12 }}>
            ⏹️ Stop
          </button>
        )}
      </div>

      <p><b>Status:</b> {listening ? "Listening..." : "Not listening"}</p>
      <p><b>You said:</b> {text || "(nothing yet)"}</p>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}