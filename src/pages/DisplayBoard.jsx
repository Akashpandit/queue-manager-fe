import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../api";
import "./DisplayBoard.css";
import AppHeader from "../components/AppHeader";
import { FullLogo } from "../components/AppHeader";

function DisplayBoard() {
  const { publicId } = useParams();
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
const audioContextRef = useRef(null);
const lastServingRef = useRef(null);
const hasSeenInitialQueueRef = useRef(false);

  const queueUrl = `${window.location.origin}/q/${publicId}`;


  const playQueueChime = (context) => {
  if (!context || context.state !== "running") return;

  const now = context.currentTime;

  // A pleasant two-note notification chime.
  [880, 1174].forEach((frequency, index) => {
    const start = now + index * 0.16;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(start);
    oscillator.stop(start + 0.34);
  });
};

const enableSound = async () => {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      setError("Audio is not supported by this browser.");
      return;
    }

    let context = audioContextRef.current;

    if (!context || context.state === "closed") {
      context = new AudioContextClass();
      audioContextRef.current = context;
    }

    await context.resume();

    setSoundEnabled(true);
    playQueueChime(context);
  } catch {
    setError("Unable to enable sound. Please try again.");
  }
};

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const result = await api.getQueue(publicId);

        if (alive) {
          setQueue(result);
          setError("");
        }
      } catch (e) {
        if (alive) {
          setError(e.message || "Unable to connect to the queue.");
        }
      }
    };

    load();

    const timer = setInterval(load, 5000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [publicId]);

  useEffect(() => {
  if (!queue) return;

  const currentServing = queue.now_serving ?? null;

  // Record the initial token without playing a sound.
  if (!hasSeenInitialQueueRef.current) {
    lastServingRef.current = currentServing;
    hasSeenInitialQueueRef.current = true;
    return;
  }

  // Only alert when the serving token actually changes.
  if (currentServing !== lastServingRef.current) {
    lastServingRef.current = currentServing;

    if (currentServing != null && soundEnabled) {
      playQueueChime(audioContextRef.current);
    }
  }
}, [queue?.now_serving, soundEnabled]);

  if (!queue) {
    return (
      <main className="db-screen db-loading">
        <div className="db-loading-mark">L</div>
        <h1>LineUp</h1>
        <p>{error || "Connecting to your queue..."}</p>
        {error && (
          <button
            className="db-retry"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        )}
      </main>
    );
  }

  const wait =
    queue.estimated_wait_for_new_joiner_minutes ??
    queue.estimated_wait_minutes;

  const isOpen = queue.status === "open";
  const isClosed = queue.status === "closed";

  return (
    <main className="db-screen">
      <div className="db-board">
        <header className="db-header">
        <FullLogo variant={'light'}/>
          

          <div
            className={`db-status ${
              isOpen
                ? "db-status-open"
                : isClosed
                  ? "db-status-closed"
                  : "db-status-break"
            }`}
          >
            <span className="db-status-dot" />
            {isOpen ? "Queue open" : isClosed ? "Shop closed" : "On a break"}
          </div>
        </header>

        <section className="db-welcome">
          <p className="db-eyebrow">WELCOME</p>
          <h1>{queue.store_name || "Our Shop"}</h1>
          <p className="db-welcome-sub">
            Please check the display for your turn.
          </p>
        </section>

        <section className="db-now-card" aria-live="polite">
          <div className="db-now-top">
            <div className="db-live-indicator">
              <span />
              LIVE QUEUE
            </div>
            <span className="db-now-caption">CURRENTLY SERVING</span>
          </div>

          <div className="db-token-area">
            <span className="db-token-prefix">
              {queue.now_serving != null ? "#" : ""}
            </span>
            <span className="db-token-number">
              {queue.now_serving != null ? queue.now_serving : "—"}
            </span>
          </div>

          <div className="db-now-bottom">
            {queue.now_serving != null
              ? "Please proceed when your token is called"
              : "No customer is being served right now"}
          </div>
        </section>

        <section className="db-info-grid">
          <article className="db-info-card">
            <div className="db-info-icon db-people-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="10" cy="7" r="4" />
                <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="db-info-label">People waiting</p>
              <div className="db-info-value">
                {queue.waiting_count ?? 0}
                <span className="db-info-unit"> in queue</span>
              </div>
            </div>
          </article>

          <article className="db-info-card">
            <div className="db-info-icon db-clock-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>
            <div>
              <p className="db-info-label">Estimated wait</p>
              <div className="db-info-value">
                {wait ?? "—"}
                <span className="db-info-unit"> min</span>
              </div>
            </div>
          </article>
        </section>

        <footer className="db-footer">
          <div className="db-footer-message">
            <div className="db-footer-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M3 10V6a2 2 0 0 1 2-2h4l11 11-6 6L3 10Z" />
                <circle cx="7.5" cy="7.5" r="1" />
              </svg>
            </div>
            <div>
              <h2>Skip the line. Join digitally.</h2>
              <p>Scan this QR code to join the queue from your phone.</p>
            </div>
          </div>

          <div className="db-qr-panel">
            <div className="db-qr-frame">
              <QRCodeSVG
                value={queueUrl}
                size={148}
                level="M"
                includeMargin
                bgColor="#FFFFFF"
                fgColor="#172033"
              />
            </div>
            <span className="db-qr-label">SCAN TO JOIN</span>
          </div>
        </footer>

        <div className="db-bottom-line">
          <span>Thank you for your patience</span>
          <span className="db-refresh-indicator">
            <span className="db-refresh-dot" />
            Updates automatically
          </span>
          <button
  type="button"
  className="db-sound-button"
  onClick={enableSound}
  aria-pressed={soundEnabled}
>
  <span aria-hidden="true">{soundEnabled ? "♫" : "♪"}</span>
  {soundEnabled ? "Sound enabled" : "Enable sound"}
</button>
        </div>

        {error && (
          <div className="db-connection-warning" role="status">
            Connection interrupted. Reconnecting…
          </div>
        )}
      </div>
    </main>
  );
}

export default DisplayBoard;
