
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { getOwner, saveOwner, removeOwner } from "../owner";
import { minutesSince } from "../utils";
import "./Dashboard.css";
import AppHeader from "../components/AppHeader";

const SHOP_STATUSES = [
  { value: "open", label: "Open" },
  { value: "break", label: "On break" },
  { value: "closed", label: "Closed" },
];

function Icon({ name, size = 18 }) {
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

  const paths = {
    screen: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
    qr: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM20 14v2M14 20h2M20 19v2M18 17h3" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
  };

  return <svg {...common}>{paths[name] || null}</svg>;
}

function StatCard({ icon, label, value, detail }) {
  return (
    <div className="dq-stat">
      <div className="dq-stat-top">
        <span className="dq-stat-icon">
          <Icon name={icon} size={18} />
        </span>
        <span className="dq-stat-label">{label}</span>
      </div>

      <div className="dq-stat-value">{value}</div>

      {detail && <div className="dq-stat-detail">{detail}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { publicId } = useParams();

  const [ownerKey, setOwnerKey] = useState(
    () => getOwner(publicId)?.owner_key || ""
  );
  const [store, setStore] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);

  const toastTimer = useRef(null);
  const statusRef = useRef(null);

  // Load public shop information.
  useEffect(() => {
    let active = true;

    api
      .getStore(publicId)
      .then((result) => {
        if (active) {
          setStore(result);
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Unable to load shop information.");
        }
      });

    return () => {
      active = false;
    };
  }, [publicId]);

  // Load the owner's queue data.
  const refresh = useCallback(async () => {
    if (!ownerKey) return;

    try {
      const result = await api.manage(publicId, ownerKey);
      setData(result);
      setError("");
    } catch (err) {
      if (err.status === 401) {
        removeOwner(publicId);
        setOwnerKey("");
        setData(null);
        setLoginError("That owner key is not valid. Please enter it again.");
      } else {
        setError(err.message || "Unable to refresh the queue.");
      }
    }
  }, [publicId, ownerKey]);

  // Poll for updates every five seconds.
  useEffect(() => {
    if (!ownerKey) return undefined;

    refresh();

    const timer = setInterval(refresh, 5000);

    return () => clearInterval(timer);
  }, [refresh, ownerKey]);

  // Close the status dropdown when clicking outside or pressing Escape.
  useEffect(() => {
    if (!statusOpen) return undefined;

    function handlePointerDown(event) {
      if (
        statusRef.current &&
        !statusRef.current.contains(event.target)
      ) {
        setStatusOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setStatusOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [statusOpen]);

  useEffect(() => {
    return () => clearTimeout(toastTimer.current);
  }, []);

  function showToast(text, bad = false) {
    setToast({ text, bad });

    clearTimeout(toastTimer.current);

    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, 2500);
  }

  async function act(fn, message) {
    setBusy(true);

    try {
      const result = await fn();

      showToast(
        typeof message === "function" ? message(result) : message
      );

      await refresh();
    } catch (err) {
      showToast(err.message || "Something went wrong.", true);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    const key = keyInput.trim();

    if (!key) return;

    try {
      await api.manage(publicId, key);

      saveOwner(publicId, {
        owner_key: key,
        name: store?.name,
      });

      setLoginError("");
      setOwnerKey(key);
    } catch (err) {
      setLoginError(
        err.status === 401
          ? "That owner key is not valid."
          : err.message || "Unable to sign in."
      );
    }
  }

  const addWalkIn = (serviceName) =>
    act(
      () =>
        api
          .walkIn(publicId, ownerKey, {
            service_name: serviceName,
            customer_name: guestName.trim() || null,
          })
          .then((result) => {
            setGuestName("");
            return result;
          }),
      (result) => `Token #${result.token_number} added`
    );

  const callNext = () =>
    act(
      () => api.callNext(publicId, ownerKey),
      (result) =>
        result.now_serving
          ? `Now serving #${result.now_serving.token_number}`
          : "Queue is clear"
    );

  const setShopStatus = (status) => {
    if (status === store?.status) {
      setStatusOpen(false);
      return;
    }

    setStatusOpen(false);

    return act(
      async () => {
        const updated = await api.updateStore(publicId, ownerKey, {
          status,
        });

        setStore(updated);
        return updated;
      },
      status === "open"
        ? "Shop is open"
        : status === "break"
          ? "Marked as on break"
          : "Shop is closed"
    );
  };

  const markDone = (token) =>
    act(
      () => api.markDone(publicId, ownerKey, token),
      `#${token} marked done`
    );

  const markNoShow = (token) => {
    if (!window.confirm(`Mark token #${token} as no-show?`)) return;

    act(
      () => api.markNoShow(publicId, ownerKey, token),
      `#${token} marked no-show`
    );
  };

  // Owner login screen.
  if (!ownerKey) {
    return (
      <main className="dq-page dq-login-page">
        <div className="dq-login-brand">
          <span className="dq-brand-mark">L</span>
          <span>LineUp</span>
        </div>

        <section className="dq-login-card">
          <div className="dq-login-icon">
            <Icon name="lock" size={25} />
          </div>

          <p className="dq-eyebrow">OWNER ACCESS</p>

          <h1>{store?.name || "Manage your queue"}</h1>

          <p className="dq-login-description">
            Enter your owner key to manage customers, track tokens, and
            control your shop queue.
          </p>

          <form onSubmit={handleLogin} className="dq-login-form">
            <label htmlFor="dq-owner-key">Owner key</label>

            <input
              id="dq-owner-key"
              className="dq-input"
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value)}
              placeholder="Enter your owner key"
              autoComplete="off"
              required
            />

            {loginError && (
              <p className="dq-error" role="alert">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="dq-primary-button dq-full-button"
            >
              Open dashboard
              <Icon name="arrow" size={18} />
            </button>
          </form>

          <p className="dq-login-footnote">
            Your owner key is saved on this device after successful login.
          </p>
        </section>
      </main>
    );
  }

  // Loading and error screen.
  if (!data || !store) {
    return (
      <main className="dq-page dq-loading-page">
        {error ? (
          <div className="dq-error-panel">
            <p className="dq-error">{error}</p>

            <button
              className="dq-secondary-button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="dq-loading-card">
            <span className="dq-spinner" />
            <strong>Loading your queue</strong>
            <span>Getting the latest shop information…</span>
          </div>
        )}
      </main>
    );
  }

  const serving = data.now_serving;
  const waiting = data.waiting || [];
  const services = store.services || [];

  const elapsed = serving ? minutesSince(serving.started_at) : 0;

  const progress = serving?.duration_minutes
    ? Math.min(
        100,
        Math.round((elapsed / serving.duration_minutes) * 100)
      )
    : null;

  const overtime =
    serving?.duration_minutes != null &&
    elapsed > serving.duration_minutes;

  const nextLabel = waiting.length
    ? `Call next · #${waiting[0].token_number}`
    : serving
      ? "Finish current"
      : "No one waiting";

  const statusLabel =
    SHOP_STATUSES.find((status) => status.value === store.status)?.label ||
    "Closed";

  return (
    <>
      <AppHeader
  variant="light"
  showAction={false}
  showMenu
  menuItems={[
    {
      label: "Display queue",
      to: `/display/${publicId}`,
      icon: "screen",
      external: true,
    },
    {
      label: "QR code",
      to: `/shop/${publicId}`,
      icon: "qr",
    },
    {
      label: "Edit shop",
      to: `/shop/${publicId}/edit`,
      icon: "edit",
    },
  ]}
/>

      <main className="dq-page">
        <div className="dq-container">
          <header className="dq-header">
            <div className="dq-header-main">
              <div className="dq-heading-copy">
                <p className="dq-eyebrow">SHOP DASHBOARD</p>

                <h1>{store.name}</h1>

                <p className="dq-date">Today · {data.queue_date}</p>
              </div>

              {/* Single status badge and dropdown. */}
              <div className="dq-status-control" ref={statusRef}>
                <button
                  type="button"
                  className={`dq-status-badge ${store.status}`}
                  onClick={() => setStatusOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={statusOpen}
                  aria-label={`Shop status: ${statusLabel}. Change status`}
                >
                  <span className="dq-status-dot" />
                  {statusLabel}
                  <Icon name="chevron" size={14} />
                </button>

                {statusOpen && (
                  <div className="dq-status-menu" role="menu">
                    <p className="dq-menu-caption">SHOP AVAILABILITY</p>

                    {SHOP_STATUSES.map((status) => (
                      <button
                        key={status.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={store.status === status.value}
                        className={`dq-status-menu-item ${
                          store.status === status.value ? "selected" : ""
                        }`}
                        disabled={busy}
                        onClick={() => setShopStatus(status.value)}
                      >
                        <span
                          className={`dq-status-dot ${status.value}`}
                        />
                        <span>{status.label}</span>

                        {store.status === status.value && (
                          <Icon name="check" size={16} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Keep shortcuts visible; the app-wide hamburger belongs in AppHeader. */}
            {/* <nav className="dq-header-actions" aria-label="Shop shortcuts">
              <a
                className="dq-shortcut"
                href={`/display/${publicId}`}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="screen" />
                <span>Display</span>
              </a>

              <a className="dq-shortcut" href={`/shop/${publicId}`}>
                <Icon name="qr" />
                <span>QR code</span>
              </a>

              <a
                className="dq-shortcut"
                href={`/shop/${publicId}/edit`}
              >
                <Icon name="edit" />
                <span>Edit shop</span>
              </a>
            </nav> */}
          </header>

          {error && (
            <div className="dq-inline-error" role="alert">
              {error}
            </div>
          )}

          {/* <section className="dq-status-section">
            <div>
              <h2>Shop availability</h2>
              <p>Control whether customers can join your queue.</p>
            </div>

            <div
              className="dq-status-switch"
              role="group"
              aria-label="Shop status"
            >
              {SHOP_STATUSES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`dq-status-option ${
                    store.status === value
                      ? `selected ${value}`
                      : ""
                  }`}
                  disabled={busy}
                  aria-pressed={store.status === value}
                  onClick={() => setShopStatus(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section> */}

          {/* Original four-card statistics layout. */}
          <section className="dq-stats-grid" aria-label="Queue overview">
            <StatCard
              icon="users"
              label="Waiting"
              value={waiting.length}
              detail={
                waiting.length === 1
                  ? "customer in queue"
                  : "customers in queue"
              }
            />

            <StatCard
              icon="check"
              label="Completed"
              value={data.done_today ?? 0}
              detail="tokens today"
            />

            <StatCard
              icon="clock"
              label="New customer wait"
              value={`${data.estimated_wait_for_new_customer ?? 0}m`}
              detail="estimated wait"
            />

            <StatCard
              icon="arrow"
              label="Avg. service"
              value={`${Math.round(data.average_service_minutes ?? 0)}m`}
              detail="per customer"
            />
          </section>

          <div className="dq-main-grid">
            <div className="dq-primary-column">
              {/* Current customer. */}
              <section
                className={`dq-card dq-serving-card ${
                  serving ? "is-active" : ""
                }`}
              >
                <div className="dq-section-heading">
                  <div>
                    <p className="dq-eyebrow">CURRENT CUSTOMER</p>
                    <h2>Now serving</h2>
                  </div>

                  {serving && (
                    <span className="dq-live-badge">
                      <span />
                      In progress
                    </span>
                  )}
                </div>

                {serving ? (
                  <>
                    <div className="dq-serving-customer">
                      <div className="dq-serving-token">
                        {serving.token_number}
                      </div>

                      <div className="dq-serving-details">
                        <h3>{serving.customer_name || "Guest"}</h3>
                        <p>{serving.service_name || "General service"}</p>

                        <span>
                          <Icon name="clock" size={14} />
                          {elapsed} min elapsed
                        </span>
                      </div>
                    </div>

                    {progress !== null && (
                      <div className="dq-progress-section">
                        <div className="dq-progress-meta">
                          <span>Service progress</span>

                          <strong
                            className={
                              overtime ? "dq-overtime-text" : ""
                            }
                          >
                            {progress}%
                          </strong>
                        </div>

                        <div className="dq-progress-track">
                          <div
                            className={`dq-progress-fill ${
                              overtime ? "over" : ""
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <p
                          className={`dq-progress-caption ${
                            overtime ? "over" : ""
                          }`}
                        >
                          {elapsed} of {serving.duration_minutes} min
                          estimated
                          {overtime ? " · Running over" : ""}
                        </p>
                      </div>
                    )}

                    <div className="dq-serving-actions">
                      <button
                        className="dq-done-button"
                        disabled={busy}
                        onClick={() => markDone(serving.token_number)}
                      >
                        <Icon name="check" size={19} />
                        Mark as done
                      </button>

                      <button
                        className="dq-no-show-button"
                        disabled={busy}
                        onClick={() => markNoShow(serving.token_number)}
                      >
                        No-show
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="dq-empty-serving">
                    <div className="dq-empty-icon">
                      <Icon name="users" size={25} />
                    </div>

                    <h3>No active customer</h3>

                    <p>
                      {waiting.length
                        ? "Your next customer is ready when you are."
                        : "When a customer joins, they will appear here."}
                    </p>
                  </div>
                )}

                <button
                  className="dq-call-next-button"
                  disabled={
                    busy || (!serving && waiting.length === 0)
                  }
                  onClick={callNext}
                >
                  {waiting.length ? (
                    <>
                      <Icon name="arrow" size={20} />
                      <span>{nextLabel}</span>
                    </>
                  ) : serving ? (
                    <>
                      <Icon name="check" size={20} />
                      <span>{nextLabel}</span>
                    </>
                  ) : (
                    <span>{nextLabel}</span>
                  )}
                </button>

                {waiting.length > 0 && (
                  <p className="dq-next-hint">
                    {waiting.length}{" "}
                    {waiting.length === 1 ? "customer" : "customers"}{" "}
                    waiting for their turn
                  </p>
                )}
              </section>

              {/* Always-visible walk-in form. */}
              <section className="dq-card dq-walkin-card">
                <div className="dq-section-heading">
                  <div>
                    <p className="dq-eyebrow">IN-PERSON VISITORS</p>
                    <h2>Add a walk-in</h2>
                  </div>

                  <span className="dq-walkin-icon">
                    <Icon name="users" size={20} />
                  </span>
                </div>

                <label
                  className="dq-field-label"
                  htmlFor="dq-guest-name"
                >
                  Customer name <span>(optional)</span>
                </label>

                <input
                  id="dq-guest-name"
                  className="dq-input"
                  placeholder="Enter customer's name"
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  maxLength={100}
                />

                {services.length > 0 ? (
                  <>
                    <p className="dq-service-instruction">
                      Select a service to add the customer to the queue.
                    </p>

                    <div className="dq-service-grid">
                      {services.map((service) => (
                        <button
                          type="button"
                          key={service.name}
                          className="dq-service-option"
                          disabled={busy}
                          onClick={() => addWalkIn(service.name)}
                        >
                          <span className="dq-service-name">
                            {service.name}
                          </span>

                          <span className="dq-service-duration">
                            {service.duration_minutes
                              ? `${service.duration_minutes} min`
                              : "Add customer"}

                            <Icon name="arrow" size={15} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <button
                    className="dq-primary-button dq-full-button"
                    disabled={busy}
                    onClick={() => addWalkIn(null)}
                  >
                    Add to queue
                    <Icon name="arrow" size={18} />
                  </button>
                )}
              </section>
            </div>

            {/* Always-visible waiting list. */}
            <section className="dq-card dq-waiting-card">
              <div className="dq-section-heading dq-waiting-heading">
                <div>
                  <p className="dq-eyebrow">UP NEXT</p>
                  <h2>Waiting list</h2>
                </div>

                <span className="dq-waiting-count">
                  {waiting.length}
                </span>
              </div>

              {waiting.length === 0 ? (
                <div className="dq-empty-waiting">
                  <div className="dq-empty-icon">
                    <Icon name="users" size={25} />
                  </div>

                  <h3>All caught up!</h3>
                  <p>There are no customers waiting right now.</p>
                </div>
              ) : (
                <ol className="dq-queue-list">
                  {waiting.map((customer, index) => (
                    <li
                      className={`dq-queue-item ${
                        index === 0 ? "is-next" : ""
                      }`}
                      key={customer.token_number}
                    >
                      <div className="dq-queue-item-top">
                        <span className="dq-queue-token">
                          #{customer.token_number}
                        </span>

                        {index === 0 && (
                          <span className="dq-next-badge">Next</span>
                        )}
                      </div>

                      <div className="dq-queue-customer">
                        <strong>
                          {customer.customer_name || "Guest"}
                        </strong>

                        <span>
                          {customer.service_name || "General service"}
                        </span>
                      </div>

                      <div className="dq-queue-meta">
                        <span>
                          <Icon name="clock" size={14} />
                          Waiting {minutesSince(customer.joined_at)} min
                        </span>

                        {customer.duration_minutes ? (
                          <span>
                            {customer.duration_minutes} min service
                          </span>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        className="dq-remove-button"
                        disabled={busy}
                        onClick={() =>
                          markNoShow(customer.token_number)
                        }
                      >
                        Remove from queue
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <footer className="dq-footer">
            <span className="dq-footer-mark">L</span>

            <span>
              Powered by <strong>LineUp</strong>
            </span>

            <span className="dq-auto-refresh">
              <span />
              Live updates · Every 5 sec
            </span>
          </footer>
        </div>

        {toast && (
          <div
            className={`dq-toast ${toast.bad ? "is-error" : ""}`}
            role="status"
            aria-live="polite"
          >
            <span className="dq-toast-icon">
              <Icon name={toast.bad ? "arrow" : "check"} size={18} />
            </span>

            {toast.text}
          </div>
        )}
      </main>
    </>
  );
}
