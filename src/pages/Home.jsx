
import { Link ,Navigate} from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import "./Home.css";
import { useAuth } from "../auth.jsx";
import { listOwners, removeOwner } from "../owner";
import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";

const useCases = [
  {
    icon: "scissors",
    title: "Barber shops & salons",
    description:
      "Let customers take a token and know when their turn is coming.",
    label: "PERSONAL CARE",
  },
  {
    icon: "stethoscope",
    title: "Clinics & consultations",
    description:
      "Keep visitors informed while helping your waiting room stay organized.",
    label: "HEALTHCARE",
  },
  {
    icon: "wrench",
    title: "Repair & service shops",
    description:
      "Organize walk-ins without juggling paper registers or calling names.",
    label: "LOCAL SERVICES",
  },
];

const steps = [
  {
    number: "01",
    icon: "store",
    title: "Set up your shop",
    description:
      "Add your shop details, services and typical service durations.",
    tag: "FOR BUSINESSES",
  },
  {
    number: "02",
    icon: "qr",
    title: "Display your QR code",
    description:
      "Put your unique QR code at the counter or entrance for customers to scan.",
    tag: "ONE-TIME SETUP",
  },
  {
    number: "03",
    icon: "smartphone",
    title: "Customers join the queue",
    description:
      "Customers choose a service and receive a token with an estimated wait.",
    tag: "NO APP NEEDED",
  },
  {
    number: "04",
    icon: "check",
    title: "Serve the next customer",
    description:
      "Call the next token from your dashboard and keep things moving.",
    tag: "FOR BUSINESSES",
  },
];

function FeatureIcon({ name, size = 24 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: "false",
  };

  const paths = {
    scissors: (
      <>
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="m8.2 8.2 11.6 11.6M8.2 15.8 20 4M14 10l-3 3" />
      </>
    ),
    stethoscope: (
      <>
        <path d="M6 3v5a4 4 0 0 0 8 0V3" />
        <path d="M6 5H4M14 5h2" />
        <path d="M10 12v2a6 6 0 0 0 12 0v-2" />
        <circle cx="22" cy="11" r="2" />
      </>
    ),
    wrench: (
      <path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18a2.1 2.1 0 0 0 3 3l5.3-5.3a5 5 0 0 0 6.4-6.4L14 13l-3-3 3.7-3.7Z" />
    ),
    store: (
      <>
        <path d="M3 10h18l-2-6H5l-2 6Z" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
        <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      </>
    ),
    qr: (
      <>
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" />
        <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1" />
      </>
    ),
    smartphone: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="2.5" />
        <path d="M10 5h4M11 18h2" />
        <path d="m9 10 2 2 4-4" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" />
        <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.check}</svg>;
}

function QueuePreview({ variant = "desktop" }) {
  return (
    <div
      className={`home-preview home-preview-${variant}`}
      aria-label="Illustration of a queue dashboard"
    >
      <div className="home-preview-glow" />

      <div className="home-preview-card">
        <div className="home-preview-header">
          <div className="home-preview-brand">
            <span className="home-preview-brand-icon">
              <FeatureIcon name="store" size={17} />
            </span>
            <div>
              <strong>Studio North</strong>
              <span>Queue dashboard</span>
            </div>
          </div>
          <span className="home-preview-status">
            <span />
            LIVE
          </span>
        </div>

        <div className="home-preview-summary">
          <div>
            <span className="home-preview-label">NOW SERVING</span>
            <strong className="home-serving-number">#08</strong>
            <span className="home-preview-caption">Haircut</span>
          </div>
          <div className="home-preview-wait">
            <span className="home-preview-label">EST. WAIT</span>
            <strong>~12 <small>min</small></strong>
            <span className="home-wait-indicator">
              <FeatureIcon name="clock" size={13} />
              Updated live
            </span>
          </div>
        </div>

        <div className="home-preview-queue-heading">
          <strong>Up next</strong>
          <span>3 customers</span>
        </div>

        <div className="home-preview-person">
          <span className="home-preview-token">09</span>
          <div className="home-preview-person-info">
            <strong>Customer 09</strong>
            <span>Haircut</span>
          </div>
          <span className="home-preview-time">~12 min</span>
        </div>

        <div className="home-preview-person">
          <span className="home-preview-token home-preview-token-violet">10</span>
          <div className="home-preview-person-info">
            <strong>Customer 10</strong>
            <span>Beard trim</span>
          </div>
          <span className="home-preview-time">~22 min</span>
        </div>

        <div className="home-preview-person home-preview-person-last">
          <span className="home-preview-token home-preview-token-blue">11</span>
          <div className="home-preview-person-info">
            <strong>Customer 11</strong>
            <span>Haircut</span>
          </div>
          <span className="home-preview-time">~32 min</span>
        </div>

        <div className="home-preview-footer">
          <span className="home-preview-footer-check">
            <FeatureIcon name="check" size={14} />
          </span>
          Queue organized. Customers informed.
        </div>
      </div>

      <div className="home-floating-note home-floating-note-top">
        <span className="home-floating-note-icon">
          <FeatureIcon name="qr" size={19} />
        </span>
        <span>
          <strong>Scan to join</strong>
          <small>No app required</small>
        </span>
      </div>

      <div className="home-floating-note home-floating-note-bottom">
        <span className="home-floating-live" />
        <span>
          <strong>Your turn is coming</strong>
          <small>Know before you wait</small>
        </span>
      </div>
    </div>
  );
}

export default function Home() {
      const { user, loading } = useAuth();

  // Owners have nothing to do on the landing page, so send them to their shops.
  if (loading) return null;
  if (user) return <Navigate to="/shops" replace />;

  const startPath = "/signup";
  return (
    <main className="home-page">
      

      <section className="home-hero">
        <AppHeader variant="hero" />
        <div className="home-hero-inner">
          <div className="home-hero-content">
            <span className="home-pill">
              <span className="home-pill-dot" />
              QUEUES, MADE SIMPLE
            </span>

            <h1>
              Good service.
              <br />
              <span>Less waiting.</span>
            </h1>

            <p className="home-intro">
              A simpler way to manage walk-ins. Customers take a token,
              track their turn, and wait on their own terms.
            </p>

            <div className="home-hero-actions">
              <Link to={startPath} className="home-primary-button">
                Set up your shop
                <FeatureIcon name="arrow" size={18} />
              </Link>
              <br />
            </div>

            <div className="home-trust-line">
              <span>
                <FeatureIcon name="check" size={15} />
                No app download
              </span>
              <span>
                <FeatureIcon name="check" size={15} />
                No customer sign-up
              </span>
            </div>
          </div>

        <QueuePreview variant="desktop" />
        </div>

        <div className="home-hero-bottom">
          <span>BUILT FOR EVERYDAY BUSINESS</span>
          <div className="home-hero-bottom-items">
            <span><FeatureIcon name="scissors" size={15} /> Salons</span>
            <span><FeatureIcon name="stethoscope" size={15} /> Clinics</span>
            <span><FeatureIcon name="wrench" size={15} /> Service shops</span>
          </div>
        </div>
      </section>
          {/* Mobile-only dashboard preview: the second screen */}
      <section
        className="home-mobile-preview-section"
        aria-labelledby="home-mobile-preview-title"
      >
        <div className="home-mobile-preview-heading">
          <p className="home-eyebrow">YOUR QUEUE, AT A GLANCE</p>
          <h2 id="home-mobile-preview-title">
            Everyone knows whose turn is next.
          </h2>
          <p>
            Customers track their wait while you keep the queue moving.
          </p>
        </div>

        <QueuePreview variant="mobile" />

        <a href="#how-it-works" className="home-mobile-preview-link">
          See how LineUp works
          <FeatureIcon name="arrow" size={16} />
        </a>
      </section>

      <section className="home-use-cases" id="use-cases">
        <div className="home-section-heading">
          <p className="home-eyebrow">MADE FOR WALK-INS</p>
          <h2>A better queue starts here.</h2>
          <p>
            Whether you serve customers, patients or clients, make waiting
            a little easier for everyone.
          </p>
        </div>

        <div className="home-use-grid">
          {useCases.map((item, index) => (
            <article
              className="home-use-card"
              key={item.title}
              style={{ "--card-index": index }}
            >
              <div className="home-use-card-top">
                <span className="home-use-icon">
                  <FeatureIcon name={item.icon} size={25} />
                </span>
                <span className="home-use-label">{item.label}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="home-card-arrow" aria-hidden="true">
                <FeatureIcon name="arrow" size={17} />
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="home-how" id="how-it-works">
        <div className="home-section-heading">
          <p className="home-eyebrow">SIMPLE FROM DAY ONE</p>
          <h2>Four steps. One smoother queue.</h2>
          <p>
            Set up once. Let customers join easily. Keep your day moving.
          </p>
        </div>

        <div className="home-steps">
          {steps.map((step, index) => (
            <article
              className="home-step"
              key={step.number}
              style={{ "--step-index": index }}
            >
              <div className="home-step-top">
                <span className="home-step-number">{step.number}</span>
                <span className="home-step-icon">
                  <FeatureIcon name={step.icon} size={25} />
                </span>
              </div>
              <span className="home-step-tag">{step.tag}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>

        <div className="home-how-note">
          <span className="home-how-note-icon">
            <FeatureIcon name="smartphone" size={22} />
          </span>
          <p>
            <strong>Easy for your customers.</strong> They scan the QR code,
            get a token and check their estimated wait from their phone
            browser — without installing another app.
          </p>
        </div>
      </section>

      

      <section className="home-bottom-cta">
        <div className="home-bottom-cta-copy">
          <span className="home-bottom-cta-icon">
            <FeatureIcon name="sparkle" size={24} />
          </span>
          <p className="home-eyebrow">YOUR SHOP, A LITTLE MORE ORGANIZED</p>
          <h2>Make every turn a better experience.</h2>
          <p>
            Get your shop online and make queue management simpler for you
            and your customers.
          </p>
        </div>
        <Link to={startPath} className="home-primary-button home-cta-button">
          Get started for free
          <FeatureIcon name="arrow" size={18} />
        </Link>
      </section>

      <footer className="home-footer">
        <Link to="/" className="home-footer-brand">
          LineUp<span>.</span>
        </Link>
        <span className="home-footer-tagline">Less waiting. Better business.</span>
        
      </footer>
    </main>
  );
}
