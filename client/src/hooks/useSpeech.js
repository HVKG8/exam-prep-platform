import { useState, useRef, useEffect } from "react";

export default function useSpeech(lang = "en-IN") {
  const SR =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const [listening, setListening] = useState(false);
  const [text, setTextState] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [restarts, setRestarts] = useState(0);
  const [lastEvent, setLastEvent] = useState("none");

  const recRef = useRef(null);
  const wantRef = useRef(false);
  const textRef = useRef("");
  const interimRef = useRef("");
  const heardRef = useRef(false);
  const startedAtRef = useRef(0);
  const quickFailsRef = useRef(0);

  const setText = (value) => {
    textRef.current = value;
    setTextState(value);
  };

  const appendText = (piece) => {
    const clean = (piece || "").trim();
    if (!clean) return;
    const old = textRef.current.trimEnd();
    setText(old ? old + " " + clean : clean);
  };

  const begin = () => {
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    heardRef.current = false;
    interimRef.current = "";
    startedAtRef.current = Date.now();

    rec.onstart = () => setLastEvent("listening");

    rec.onresult = (e) => {
      heardRef.current = true;
      let interimPart = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          appendText(r[0].transcript);
          interimRef.current = "";
        } else {
          interimPart += r[0].transcript;
        }
      }
      if (interimPart) interimRef.current = interimPart;
      setInterim(interimPart);
    };

    rec.onerror = (e) => {
      setLastEvent("error: " + e.error);
      if (e.error === "no-speech" || e.error === "aborted") return;
      wantRef.current = false;
      setListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microphone is blocked. Allow the microphone for this site, then try again.");
      } else if (e.error === "audio-capture") {
        setError("No microphone found.");
      } else if (e.error === "network") {
        setError("Network problem. Voice needs internet.");
      } else {
        setError("Voice error: " + e.error);
      }
    };

    rec.onend = () => {
      setLastEvent("ended");

      // keep words that were still unfinished when Chrome stopped
      if (interimRef.current) {
        appendText(interimRef.current);
        interimRef.current = "";
      }
      setInterim("");

      if (!wantRef.current) {
        setListening(false);
        return;
      }

      // safety: if it ends instantly again and again, stop trying
      const lived = Date.now() - startedAtRef.current;
      if (!heardRef.current && lived < 1000) quickFailsRef.current += 1;
      else quickFailsRef.current = 0;

      if (quickFailsRef.current >= 5) {
        wantRef.current = false;
        setListening(false);
        setError("The microphone stopped responding. Tap Start to try again.");
        return;
      }

      // Chrome stopped by itself: listen again
      setTimeout(() => {
        if (wantRef.current) {
          setRestarts((n) => n + 1);
          begin();
        }
      }, 250);
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      setLastEvent("start failed");
    }
  };

  const start = () => {
    if (!SR) {
      setError("Voice is not supported in this browser. Please type your answer.");
      return;
    }
    if (wantRef.current) return;
    setError("");
    quickFailsRef.current = 0;
    wantRef.current = true;
    setListening(true);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    begin();
  };

  const stop = () => {
    wantRef.current = false;
    setListening(false);
    try {
      if (recRef.current) recRef.current.stop();
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    return () => {
      wantRef.current = false;
      try {
        if (recRef.current) recRef.current.abort();
      } catch (err) {
        // ignore
      }
    };
  }, []);

  return {
    supported: !!SR,
    listening,
    text,
    interim,
    error,
    restarts,
    lastEvent,
    start,
    stop,
    setText,
  };
}