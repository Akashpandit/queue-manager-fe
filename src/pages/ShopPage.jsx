
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { api } from "../api";
import AppHeader from "../components/AppHeader";
import "./ShopPage.css";

function Icon({ name, size = 20 }) {
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
    dashboard: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="2" />
        <rect x="13" y="3" width="8" height="5" rx="2" />
        <rect x="13" y="10" width="8" height="11" rx="2" />
        <rect x="3" y="13" width="8" height="8" rx="2" />
      </>
    ),
    display: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5" />
        <path d="M5 16v4h14v-4" />
      </>
    ),
    external: (
      <>
        <path d="M14 4h6v6M20 4l-9 9" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
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

export default function ShopPage() {
  const { publicId } = useParams();
  const location = useLocation();
  const canvasWrap = useRef(null);

  const [store, setStore] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const [owner] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`owner:${publicId}`) || "null"
      );
    } catch {
      return null;
    }
  });

  const queueUrl = `${window.location.origin}/q/${publicId}`;

  useEffect(() => {
    let active = true;

    api
      .getStore(publicId)
      .then((data) => {
        if (active) setStore(data);
      })
      .catch((e) => {
        if (active) {
          setError(e.message || "Unable to load your shop.");
        }
      });

    return () => {
      active = false;
    };
  }, [publicId]);

  async function downloadQr() {
    const canvas = canvasWrap.current?.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    const safeName = (store?.name || "shop")
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    link.download = `${safeName || "shop"}-queue-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function copyKey() {
    if (!owner?.owner_key) return;

    setCopyError("");

    try {
      await navigator.clipboard.writeText(owner.owner_key);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError("Copy failed. Please copy the key manually.");
    }
  }

  if (error) {
    return (
      <main className="shop-page">
        <AppHeader variant="light" showAction={false} />
        <div className="shop-content">
          <section className="shop-message">
            <h1>Couldn't load your shop</h1>
            <p>{error}</p>
            <Link className="shop-button shop-button-primary" to="/">
              Back to home
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (!store) {
    return (
      <main className="shop-page">
        <AppHeader variant="light" showAction={false} />
        <div className="shop-content">
          <section className="shop-message">
            <span className="shop-loader" />
            <h2>Loading your shop</h2>
            <p>Just a moment…</p>
          </section>
        </div>
      </main>
    );
  }

  const services = store.services || [];

  return (
    <main className="shop-page">
      <AppHeader variant="light" />

      <div className="shop-content">
        {/* Shop introduction */}
        <section className="shop-intro">
          <div className="shop-ready">
            <span className="shop-ready-dot" />
            <span>Shop is ready</span>
          </div>

          <h1>{store.name}</h1>

          {store.address && (
            <p className="shop-address">
              <Icon name="pin" size={16} />
              {store.address}
            </p>
          )}

          <p className="shop-description">
            Your queue is ready. Let customers join with a quick scan.
          </p>

          <div className="shop-actions">
            <Link
              className="shop-button shop-button-primary"
              to={`/shop/${publicId}/manage`}
            >
              <Icon name="dashboard" />
              <span>Manage queue</span>
            </Link>

            <Link
              className="shop-button shop-button-secondary"
              to={`/display/${publicId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="display" />
              <span>Display screen</span>
              <Icon name="external" size={15} />
            </Link>
          </div>
        </section>

        {/* QR code */}
        <section className="shop-section shop-qr-section">
          <div className="shop-section-heading">
            <div>
              <h2>Queue QR code</h2>
              <p>Customers scan this to join your queue.</p>
            </div>
          </div>

          <div className="shop-qr-content">
            <div className="shop-qr-frame" ref={canvasWrap}>
              <QRCodeCanvas
                value={queueUrl}
                size={1024}
                level="M"
                includeMargin
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                }}
              />
            </div>

            <div className="shop-qr-actions">
              <button
                type="button"
                className="shop-button shop-button-primary shop-download"
                onClick={downloadQr}
              >
                <Icon name="download" />
                Download QR code
              </button>

              <Link
                className="shop-preview-link"
                to={`/q/${publicId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Preview customer page
                <Icon name="external" size={15} />
              </Link>
            </div>
          </div>

          <p className="shop-qr-note">
            Print it and place it where customers can easily scan it. Your QR
            code stays the same.
          </p>
        </section>

        {/* Services */}
        <section className="shop-section shop-services-section">
          <div className="shop-section-heading shop-services-heading">
            <div>
              <h2>Services</h2>
              <p>What customers can queue for.</p>
            </div>

            <span className="shop-count">{services.length}</span>
          </div>

          {services.length === 0 ? (
            <div className="shop-empty-services">
              <p>No services added yet.</p>
              <Link to={`/shop/${publicId}/edit`}>Edit shop details →</Link>
            </div>
          ) : (
            <div className="shop-services-list">
              {services.map((service, index) => (
                <div
                  className="shop-service"
                  key={`${service.name}-${index}`}
                >
                  <div className="shop-service-symbol">
                    <Icon name="tag" size={18} />
                  </div>

                  <div className="shop-service-details">
                    <h3>{service.name}</h3>
                    {service.duration_minutes ? (
                      <span>
                        <Icon name="clock" size={13} />
                        {service.duration_minutes} min
                      </span>
                    ) : null}
                  </div>

                  {service.price != null && (
                    <strong>₹{service.price}</strong>
                  )}
                </div>
              ))}
            </div>
          )}

          {services.length > 0 && (
            <Link
              className="shop-edit-link"
              to={`/shop/${publicId}/edit`}
            >
              Edit services <span>→</span>
            </Link>
          )}
        </section>

        {/* Owner key: intentionally kept at the bottom */}
        {owner?.owner_key && (
          <section className="shop-owner-section">
            <details className="shop-owner-details">
              <summary>
                <span className="shop-owner-summary-icon">
                  <Icon name="shield" size={18} />
                </span>

                <span className="shop-owner-summary-text">
                  <strong>Owner key</strong>
                  <small>Private · Used to manage your shop</small>
                </span>

                <span className="shop-owner-chevron">⌄</span>
              </summary>

              <div className="shop-owner-body">
                {location.state?.justCreated && (
                  <p className="shop-owner-notice">
                    Save this key somewhere safe. It is shown only once after
                    setup.
                  </p>
                )}

                <div className="shop-key-row">
                  <code>{owner.owner_key}</code>

                  <button
                    type="button"
                    className="shop-copy-button"
                    onClick={copyKey}
                  >
                    <Icon name={copied ? "check" : "copy"} size={16} />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                {copyError && (
                  <p className="shop-copy-error">{copyError}</p>
                )}

                <p className="shop-owner-footnote">
                  Keep this key private. It is also saved in this browser.
                </p>
              </div>
            </details>
          </section>
        )}

        <footer className="shop-footer">
          Made simpler with <strong>LineUp.</strong>
        </footer>
      </div>
    </main>
  );
}
