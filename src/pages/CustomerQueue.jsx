
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { enableSound, isSoundUnlocked, playAlert } from "../alerts";
import "./CustomerQueue.css";
import AppHeader from "../components/AppHeader";
import { LoadingButton, SlowHint, useSlow } from "../components/Loading.jsx";

const storageKey = (publicId) => `entry:${publicId}`;

function QueueIcon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    volume: (
      <>
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
      </>
    ),
    tag: (
      <>
        <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
        <circle cx="7.5" cy="7.5" r="1" />
      </>
    ),
  };

  return <svg {...common}>{icons[name]}</svg>;
}

export default function CustomerQueue() {
  const { publicId } = useParams();

  const [queue, setQueue] = useState(null);
  const [entry, setEntry] = useState(null);
  const [service, setService] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [soundOn, setSoundOn] = useState(isSoundUnlocked());
  const [servingViewDismissed, setServingViewDismissed] = useState(false);
  const slow = useSlow(busy || !queue);
  const prevStatus = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const q = await api.getQueue(publicId);
      setQueue(q);

      const key = localStorage.getItem(storageKey(publicId));

      if (key) {
        try {
          const currentEntry = await api.getEntry(key);
          setEntry({ ...currentEntry, entry_key: key });
        } catch {
          localStorage.removeItem(storageKey(publicId));
          setEntry(null);
        }
      } else {
        setEntry(null);
      }

      setError("");
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err.message || "Unable to load the queue.");
    }
  }, [publicId]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 10000);

    return () => window.clearInterval(timer);
  }, [refresh]);

  // Unlock audio after the customer's first interaction.
  useEffect(() => {
    const unlock = async () => {
      if (isSoundUnlocked()) {
        setSoundOn(true);
        return;
      }

      const ok = await enableSound();
      if (ok) setSoundOn(true);
    };

    window.addEventListener("touchend", unlock);
    window.addEventListener("click", unlock);

    return () => {
      window.removeEventListener("touchend", unlock);
      window.removeEventListener("click", unlock);
    };
  }, []);

  // Refresh when the customer returns to this browser tab.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  // Alert when the customer's turn begins.
  useEffect(() => {
    const status = entry?.status ?? null;

    if (
      status === "serving" &&
      prevStatus.current &&
      prevStatus.current !== "serving"
    ) {
      playAlert();
    }

    prevStatus.current = status;
  }, [entry?.status]);

  // Keep the browser tab title useful in the background.
  useEffect(() => {
    if (!queue) return;

    if (entry?.status === "serving") {
      document.title = `Your turn! · ${queue.store_name}`;
    } else if (entry?.status === "waiting") {
      document.title = `#${entry.token_number} · ${queue.store_name}`;
    } else {
      document.title = queue.store_name;
    }
  }, [entry?.status, entry?.token_number, queue]);

  useEffect(() => {
  if (entry?.status !== "serving") {
    setServingViewDismissed(false);
  }
}, [entry?.status]);

  async function handleJoin(e) {
    e.preventDefault();

    enableSound().then((ok) => {
      if (ok) setSoundOn(true);
    });

    setBusy(true);
    setError("");

    try {
      const result = await api.joinQueue(publicId, {
        service_name: service || null,
        customer_name: name.trim() || null,
        existing_entry_key: localStorage.getItem(storageKey(publicId)),
      });

      localStorage.setItem(storageKey(publicId), result.entry_key);
      await refresh();
    } catch (err) {
      setError(err.message || "Unable to join the queue.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Are you sure you want to leave the queue?")) return;

    setBusy(true);
    setError("");

    try {
      await api.cancelEntry(entry.entry_key);
      await refresh();
    } catch (err) {
      setError(err.message || "Unable to leave the queue.");
    } finally {
      setBusy(false);
    }
  }

  function joinAgain() {
    localStorage.removeItem(storageKey(publicId));
    setEntry(null);
    setService("");
    setName("");
    setError("");
    prevStatus.current = null;
  }

  if (!queue) {
    return (
      <main className="cq-page">
        <div className="cq-loading">
          <div className="cq-brand">LineUp<span>.</span></div>
          <span className="cq-spinner" />
          <h1>{error ? "Couldn't load the queue" : "Loading queue"}</h1>
         <p>{error || "Getting the latest shop information…"}</p>
          {!error && <SlowHint show={slow} />}
          {error && (
            <button
              className="cq-button cq-button-primary"
              type="button"
              onClick={refresh}
            >
              Try again
            </button>
          )}
        </div>
      </main>
    );
  }

  const services = queue.services || [];
  const hasServices = services.length > 0;
  const closed = queue.status === "closed";
  const onBreak = queue.status === "break";

  const joinWait =
    queue.estimated_wait_for_new_joiner_minutes ??
    queue.estimated_wait_minutes;

  const completedStatuses = ["done", "cancelled", "no_show", "expired"];
  const entryFinished = entry && completedStatuses.includes(entry.status);

  let finishedMessage = "";
  if (entry?.status === "done") {
    finishedMessage = "Your service is complete. Thank you for visiting!";
  } else if (entry?.status === "cancelled") {
    finishedMessage = "You've left the queue.";
  } else if (entry?.status === "no_show") {
    finishedMessage = "This token was marked as missed.";
  } else if (entry?.status === "expired") {
    finishedMessage = "This token belongs to an earlier day.";
  }

  return (
  <main
  className={`cq-page ${
    entry?.status === "serving" && !servingViewDismissed
      ? "cq-page-serving"
      : ""
  }`}
>
    <AppHeader variant="light" showAction={false}/>
    <div className="cq-shell">
        <div className="cq-shop-header">

          <div className="cq-shop-title">
            <h1>{queue.store_name}</h1>
            {queue.address && (
              <p>
                <QueueIcon name="pin" size={15} />
                <span>{queue.address}</span>
              </p>
            )}
          </div>

          <div
            className={`cq-shop-status ${
              closed ? "is-closed" : onBreak ? "is-break" : "is-open"
            }`}
          >
            <span />
            {closed ? "Closed" : onBreak ? "On a break" : "Open"}
          </div>
        </div>

        {closed && (
          <div className="cq-notice cq-notice-closed" role="status">
            <strong>The shop is closed right now.</strong>
            <span>Please check back when it reopens.</span>
          </div>
        )}

        {onBreak && (
          <div className="cq-notice cq-notice-break" role="status">
            <strong>The shop is taking a short break.</strong>
            <span>Waiting times may be longer than usual.</span>
          </div>
        )}

        {/* Live queue overview */}
        <section className="cq-live-section">
          <div className="cq-section-label">
            <span className="cq-live-dot" />
            LIVE QUEUE
          </div>

          <div className="cq-stats">
            <div className="cq-stat">
              <span className="cq-stat-label">Now serving</span>
              <strong className="cq-stat-number">
                {queue.now_serving != null ? `#${queue.now_serving}` : "—"}
              </strong>
            </div>

            <div className="cq-stat-divider" />

            <div className="cq-stat">
              <span className="cq-stat-label">People waiting</span>
              <strong className="cq-stat-number">{queue.waiting_count}</strong>
            </div>
          </div>

          {updatedAt && (
            <p className="cq-updated">
              Updated{" "}
              {updatedAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" · "}
              refreshes automatically
            </p>
          )}
        </section>

        {/* Customer's active token */}
        {entry?.status === "waiting" && (
          <section className="cq-ticket cq-ticket-waiting">
            <div className="cq-ticket-top">
              <span>Your queue ticket</span>
              <span className="cq-ticket-status">
                <span />
                Waiting
              </span>
            </div>

            <div className="cq-token-number">#{entry.token_number}</div>

            <div className="cq-position">
              {entry.position === 1
                ? "You're next in line"
                : `${Math.max(0, (entry.position ?? 1) - 1)} ${
                    (entry.position ?? 1) - 1 === 1
                      ? "person"
                      : "people"
                  } ahead of you`}
            </div>

            <div className="cq-wait-estimate">
              <QueueIcon name="clock" size={19} />
              <div>
                <span>Estimated wait</span>
                <strong>
                  {entry.estimated_wait_minutes === 0
                    ? "Any moment now"
                    : `About ${entry.estimated_wait_minutes} min`}
                </strong>
              </div>
            </div>

            {entry.service_name && (
              <p className="cq-ticket-service">
                Service: <strong>{entry.service_name}</strong>
              </p>
            )}

            <div className="cq-ticket-divider" />

            <button
              type="button"
              className="cq-sound-button"
              onClick={() =>
                enableSound({ audible: true }).then((ok) => {
                  if (ok) setSoundOn(true);
                })
              }
            >
              <QueueIcon name={soundOn ? "volume" : "bell"} size={18} />
              {soundOn ? "Sound alert enabled · Test sound" : "Enable sound alert"}
            </button>

            <p className="cq-sound-note">
              Keep this page open and your phone's sound on. Alerts may not play
              when your phone is locked or the browser is suspended.
            </p>

                        <LoadingButton
              type="button"
              className="cq-text-button cq-danger-link"
              onClick={handleCancel}
              loading={busy}
              loadingText="Leaving queue…"
            >
              Leave queue
            </LoadingButton>
          </section>
        )}

        {entry?.status === "serving" && (
          <section className="cq-ticket cq-ticket-serving" role="status">
            <div className="cq-serving-icon">
              <QueueIcon name="check" size={28} />
            </div>
            <span className="cq-serving-label">IT'S YOUR TURN</span>
            <div className="cq-token-number">#{entry.token_number}</div>
            <h2>Please go to the service counter.</h2>
            <p>The shop is ready for you.</p>
            <button
                type="button"
                className="cq-serving-exit"
                onClick={() => setServingViewDismissed(true)}
                >
                Back to queue
                </button>
          </section>
        )}

        {entryFinished && (
          <section className="cq-ticket cq-ticket-finished">
            <div className="cq-finished-icon">
              <QueueIcon name="check" size={25} />
            </div>
            <h2>
              {entry.status === "done"
                ? "All done!"
                : entry.status === "cancelled"
                  ? "Queue left"
                  : "Queue update"}
            </h2>
            <p>{finishedMessage}</p>
            {!closed && (
              <button
                type="button"
                className="cq-button cq-button-primary"
                onClick={joinAgain}
              >
                Join the queue again
              </button>
            )}
          </section>
        )}

        {/* Closed state for customers without an active ticket */}
        {!entry && closed && (
          <section className="cq-closed-card">
            <h2>We'll be back soon</h2>
            <p>This shop isn't accepting new customers right now.</p>
          </section>
        )}

        {/* Join form */}
        {!entry && !closed && (
          <form className="cq-join-card" onSubmit={handleJoin}>
            <div className="cq-join-heading">
              <h2>Join the queue</h2>
              <p>Choose a service and we'll save your place.</p>
            </div>

            <div className="cq-join-wait">
              <QueueIcon name="clock" size={18} />
              <span>Estimated wait if you join now</span>
              <strong>
                {joinWait === 0 || joinWait == null
                  ? joinWait === 0
                    ? "No wait"
                    : "Unavailable"
                  : `~${joinWait} min`}
              </strong>
            </div>

            {hasServices && (
              <fieldset className="cq-service-fieldset">
                <legend>What service do you need?</legend>

                <div className="cq-service-options">
                  {services.map((item) => {
                    const selected = service === item.name;

                    return (
                      <label
                        key={item.name}
                        className={`cq-service-option ${
                          selected ? "is-selected" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="service"
                          value={item.name}
                          checked={selected}
                          onChange={() => setService(item.name)}
                        />

                        <span className="cq-radio-indicator">
                          {selected && <span />}
                        </span>

                        <span className="cq-service-info">
                          <strong>{item.name}</strong>
                          <small>
                            {[
                              item.duration_minutes
                                ? `${item.duration_minutes} min`
                                : "",
                              item.price != null ? `₹${item.price}` : "",
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Service"}
                          </small>
                        </span>

                        {selected && (
                          <span className="cq-selected-check">
                            <QueueIcon name="check" size={16} />
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <label className="cq-name-field">
              <span>Your name <small>(optional)</small></span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                placeholder="Enter your name"
                autoComplete="name"
              />
            </label>

            {error && (
              <p className="cq-form-error" role="alert">
                {error}
              </p>
            )}

                        <SlowHint show={slow} />
            <LoadingButton
              type="submit"
              className="cq-button cq-button-primary cq-join-button"
              loading={busy}
              loadingText="Getting your token…"
              disabled={hasServices && !service}
            >
              Join queue
            </LoadingButton>

            <p className="cq-privacy-note">
              Your place is saved on this device, so you can return to this
              page to check your turn.
            </p>
          </form>
        )}

        {entry && error && (
          <p className="cq-form-error cq-entry-error" role="alert">
            {error}
          </p>
        )}

        <footer className="cq-footer">
          Powered by <strong>LineUp<span>.</span></strong>
        </footer>
      </div>
    </main>
  );
}
