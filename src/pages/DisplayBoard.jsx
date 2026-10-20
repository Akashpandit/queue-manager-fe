import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../api";
import { Spinner } from "../components/Loading.jsx";
import "../components/Loading.css";
import "./DisplayBoard.css";

function DisplayBoard() {
  const { publicId } = useParams();
  const [queue, setQueue] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(`board:${publicId}`) || "null");
    } catch {
      return null;
    }
  });
  const [error, setError] = useState("");
  const [soundError, setSoundError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef(null);
  const lastServingRef = useRef(null);
  const hasSeenInitialQueueRef = useRef(false);

  const queueUrl = `${window.location.origin}/q/${publicId}`;

  const playQueueChime = (context) => {
    if (!context || context.state !== "running") return;
    const now = context.currentTime;
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
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        setSoundError("Audio is not supported by this browser.");
        return;
      }
      let context = audioContextRef.current;
      if (!context || context.state === "closed") {
        context = new AudioContextClass();
        audioContextRef.current = context;
      }
      await context.resume();
      setSoundError("");
      setSoundEnabled(true);
      playQueueChime(context);
    } catch {
      setSoundError("Unable to enable sound. Please try again.");
    }
  };

  // Poll the queue.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const result = await api.getQueue(publicId);
        if (!alive) return;
        setQueue(result);
        setError("");
        try {
          sessionStorage.setItem(`board:${publicId}`, JSON.stringify(result));
        } catch {
          // storage unavailable
        }
      } catch (e) {
        if (alive) setError(e.message || "Unable to connect to the queue.");
      }
    };
    load();
    const timer = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [publicId]);

  // Chime when the serving token changes.
  useEffect(() => {
    if (!queue) return;
    const currentServing = queue.now_serving ?? null;
    if (!hasSeenInitialQueueRef.current) {
      lastServingRef.current = currentServing;
      hasSeenInitialQueueRef.current = true;
      return;
    }
    if (currentServing !== lastServingRef.current) {
      lastServingRef.current = currentServing;
      if (currentServing != null && soundEnabled) {
        playQueueChime(audioContextRef.current);
      }
    }
  }, [queue?.now_serving, soundEnabled]);

  // Keep the screen awake (supported browsers, HTTPS or localhost).
  useEffect(() => {
    let lock = null;
    const request = async () => {
      try {
        lock = await navigator.wakeLock?.request("screen");
      } catch {
        // not supported or denied
      }
    };
    request();
    const onVisible = () => {
      if (document.visibilityState === "visible") request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release?.();
    };
  }, []);

  const loading = !queue && !error;
  const failed = !queue && !!error;

  const wait =
    queue?.estimated_wait_for_new_joiner_minutes ?? queue?.estimated_wait_minutes;

  const isOpen = queue?.status === "open";
  const isClosed = queue?.status === "closed";

  return (
    <main className="db-screen">
      <div className="db-board">
        {/* Header: business name and status */}
        <header className="db-header">
          <div className="db-title">
            <p className="db-eyebrow">WELCOME TO</p>
            {queue ? (
              <h1>{queue.store_name || "Our Shop"}</h1>
            ) : (
              <div className="db-skeleton db-skeleton-title" />
            )}
          </div>

          {queue && (
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
          )}
        </header>

        {/* Main content: one screen on desktop */}
        <div className="db-content">
          <section className="db-now-card" aria-live="polite">
            <div className="db-now-top">
              <div className="db-live-indicator">
                <span />
                LIVE QUEUE
              </div>
              <span className="db-now-caption">CURRENTLY SERVING</span>
            </div>

            <div className="db-token-area">
              {loading ? (
                <Spinner size={36} />
              ) : (
                <>
                  <span className="db-token-prefix">
                    {queue?.now_serving != null ? "#" : ""}
                  </span>
                  <span className="db-token-number">
                    {queue?.now_serving != null ? queue.now_serving : "—"}
                  </span>
                </>
              )}
            </div>

            <div className="db-now-bottom">
              {failed
                ? "Unable to reach the queue"
                : loading
                  ? "Connecting to your queue…"
                  : queue.now_serving != null
                    ? "Please proceed when your token is called"
                    : "No customer is being served right now"}
            </div>
          </section>

          <aside className="db-side">
            <article className="db-info-card">
              <div className="db-info-icon db-people-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="10" cy="7" r="4" />
                  <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <p className="db-info-label">People waiting</p>
                <div className="db-info-value">
                  {loading ? (
                    <span className="db-skeleton db-skeleton-value" />
                  ) : (
                    <>
                      {queue?.waiting_count ?? "—"}
                      <span className="db-info-unit"> in queue</span>
                    </>
                  )}
                </div>
              </div>
            </article>

            <article className="db-info-card">
              <div className="db-info-icon db-clock-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </div>
              <div>
                <p className="db-info-label">Estimated wait</p>
                <div className="db-info-value">
                  {loading ? (
                    <span className="db-skeleton db-skeleton-value" />
                  ) : (
                    <>
                      {wait ?? "—"}
                      <span className="db-info-unit"> min</span>
                    </>
                  )}
                </div>
              </div>
            </article>

            <article className="db-qr-card">
              <div className="db-qr-text">
                <h2>Skip the line. Join digitally.</h2>
                <p>Scan this QR code to join the queue from your phone.</p>
              </div>
              <div className="db-qr-frame">
                <QRCodeSVG
                  value={queueUrl}
                  size={256}
                  level="M"
                  includeMargin
                  bgColor="#FFFFFF"
                  fgColor="#172033"
                />
              </div>
              <span className="db-qr-label">SCAN TO JOIN</span>
            </article>
          </aside>
        </div>

        {/* Footer */}
        <footer className="db-bottom-line">
          <span className="db-powered">
            Powered by <strong>LineUp<span>.</span></strong>
          </span>

          <span className="db-refresh-indicator">
            <span className="db-refresh-dot" />
            Updates automatically
          </span>

          <span className="db-sound-group">
            {soundError && <span className="db-sound-error">{soundError}</span>}
            <button
              type="button"
              className="db-sound-button"
              onClick={enableSound}
              aria-pressed={soundEnabled}
            >
              <span aria-hidden="true">{soundEnabled ? "♫" : "♪"}</span>
              {soundEnabled ? "Sound enabled" : "Enable sound"}
            </button>
          </span>
        </footer>

        {error && (
          <div className="db-connection-warning" role="status">
            {failed ? (
              <>
                Can't reach the queue. {error}{" "}
                <button
                  type="button"
                  className="db-retry"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              </>
            ) : (
              "Connection interrupted. Reconnecting…"
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default DisplayBoard;