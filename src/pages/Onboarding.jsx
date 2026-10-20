
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import AppHeader from "../components/AppHeader.jsx";
import "./Onboarding.css";
import { LoadingButton, SlowHint, useSlow } from "../components/Loading.jsx";

const emptyService = () => ({
  name: "",
  duration: "",
  price: "",
});

const initialServices = [
  { name: "Haircut", duration: "20", price: "" },
  { name: "Beard Trim", duration: "10", price: "" },
];

const stepDetails = [
  {
    title: "Your shop",
    subtitle: "Let's start with the basics.",
    eyebrow: "STEP 1 OF 3",
  },
  {
    title: "Your services",
    subtitle: "What can customers book a place in line for?",
    eyebrow: "STEP 2 OF 3",
  },
  {
    title: "Review details",
    subtitle: "A quick check before your shop goes live.",
    eyebrow: "STEP 3 OF 3",
  },
];

function StepIcon({ type }) {
  const paths = {
    shop: (
      <>
        <path d="M3 10h18l-2-6H5l-2 6Z" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
        <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    trash: (
      <>
        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[type] || paths.check}
    </svg>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [services, setServices] = useState(initialServices);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const slow = useSlow(busy);

  const validServices = services.filter((service) =>
    service.name.trim()
  );

  const updateService = (index, field, value) => {
    setServices((list) =>
      list.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      )
    );
    setError("");
  };

  const removeService = (index) => {
    setServices((list) => list.filter((_, i) => i !== index));
    setError("");
  };

  const validateCurrentStep = () => {
    if (step === 1 && name.trim().length < 2) {
      setError("Enter a shop name with at least 2 characters.");
      return false;
    }

    if (step === 2) {
      if (validServices.length === 0) {
        setError("Add at least one service to continue.");
        return false;
      }

      const invalidDuration = validServices.some((service) => {
        if (service.duration === "") return false;

        const duration = Number(service.duration);

        return (
          !Number.isFinite(duration) ||
          !Number.isInteger(duration) ||
          duration < 1 ||
          duration > 480
        );
      });

      if (invalidDuration) {
        setError("Duration must be a whole number from 1 to 480 minutes.");
        return false;
      }

      const invalidPrice = validServices.some((service) => {
        if (service.price === "") return false;

        const price = Number(service.price);

        return !Number.isFinite(price) || price < 0;
      });

      if (invalidPrice) {
        setError("Price cannot be negative.");
        return false;
      }
    }

    setError("");
    return true;
  };

  const goBack = () => {
    setError("");

    if (step === 1) {
      navigate("/shops");
      return;
    }

    setStep((current) => current - 1);
  };

  async function handleSubmit(event) {
    event.preventDefault();

    if (busy) return;

    // Continue through the setup steps when the form is submitted.
    // This also makes pressing Enter on an input behave as expected.
    if (step < 3) {
      if (!validateCurrentStep()) return;
      setStep((current) => Math.min(current + 1, 3));
      return;
    }

    if (!validateCurrentStep()) return;

    setError("");
    setBusy(true);

    try {
      const payload = {
        name: name.trim(),
        address: address.trim() || null,
        services: validServices.map((service) => ({
          name: service.name.trim(),
          duration_minutes: service.duration
            ? Number(service.duration)
            : null,
          price: service.price !== "" ? Number(service.price) : null,
        })),
      };

      const store = await api.createStore(payload);
      navigate(`/shop/${store.public_id}`);
    } catch (err) {
      setError(
        err.message || "Could not create your shop. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  const stepInfo = stepDetails[step - 1];

  return (
    <main
      className={`mobile-setup mobile-setup-step-${step}`}
      data-step={step}
    >

      <div className="mobile-setup-app">
        <AppHeader
          variant={step === 3 ? "gradient" : "light"}
          showAction={false}
        />

        <form
          className="mobile-setup-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="mobile-setup-scroll">
            <section className="mobile-setup-content" key={step}>
                <div className="mobile-action-meta">
                <div className="mobile-action-dots" aria-hidden="true">
                  {[1, 2, 3].map((item) => (
                    <span
                      key={item}
                      className={item <= step ? "is-complete" : ""}
                    />
                  ))}
                </div>
                
              </div>
              <div className="mobile-setup-heading">
                <span className="mobile-setup-eyebrow">
                  
                  
                  {step === 1
                    ? "Basic information"
                    : step === 2
                      ? "Services and pricing"
                      : "Final review"}
                </span>
                

                <h1>{stepInfo.title}</h1>
                <p className="mobile-setup-subtitle">
                  {stepInfo.subtitle}
                </p>
              </div>

              {step === 1 && (
                <div className="mobile-form-fields">
                  <label className="mobile-field">
                    <span className="mobile-field-label">
                      Shop name <b>*</b>
                    </span>
                    <input
                      autoFocus
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setError("");
                      }}
                      placeholder="e.g. Rahul's Barber Shop"
                      minLength={2}
                      maxLength={150}
                      autoComplete="organization"
                      required
                    />
                    <small>
                      This is how your shop will appear to customers.
                    </small>
                  </label>

                  <label className="mobile-field">
                    <span className="mobile-field-label">
                      Shop address <em>Optional</em>
                    </span>
                    <input
                      type="text"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Enter your shop location"
                      maxLength={300}
                      autoComplete="street-address"
                    />
                    <small>Help customers find the right shop.</small>
                  </label>

                  <div className="mobile-info-card">
                    <span className="mobile-info-icon">
                      <StepIcon type="shop" />
                    </span>
                    <div>
                      <strong>Your digital queue starts here</strong>
                      <p>
                        Add your details first. You can manage your queue
                        and share your QR code after setup.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="mobile-services">
                  <div className="mobile-list-heading">
                    <div>
                      <h2>Service menu</h2>
                      <p>Add the services customers can choose from.</p>
                    </div>
                    <span className="mobile-count-pill">
                      {validServices.length}
                    </span>
                  </div>

                  {services.map((service, index) => (
                    <article className="mobile-service-card" key={index}>
                      <div className="mobile-service-top">
                        <div className="mobile-service-heading">
                          <span className="mobile-service-number">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="mobile-service-card-label">
                            Service {index + 1}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="mobile-delete-service"
                          onClick={() => removeService(index)}
                          aria-label={`Remove service ${index + 1}`}
                        >
                          <StepIcon type="trash" />
                        </button>
                      </div>

                      <label className="mobile-field">
                        <span className="mobile-field-label">
                          Service name
                        </span>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(event) =>
                            updateService(index, "name", event.target.value)
                          }
                          placeholder="e.g. Haircut"
                          maxLength={100}
                        />
                      </label>

                      <div className="mobile-service-fields">
                        <label className="mobile-field">
                          <span className="mobile-field-label">
                            Duration
                          </span>
                          <div className="mobile-input-unit">
                            <input
                              type="number"
                              inputMode="numeric"
                              min="1"
                              max="480"
                              step="1"
                              value={service.duration}
                              onChange={(event) =>
                                updateService(
                                  index,
                                  "duration",
                                  event.target.value
                                )
                              }
                              placeholder="20"
                            />
                            <span>min</span>
                          </div>
                        </label>

                        <label className="mobile-field">
                          <span className="mobile-field-label">
                            Price
                          </span>
                          <div className="mobile-input-unit">
                            <span className="mobile-currency">₹</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="0.01"
                              value={service.price}
                              onChange={(event) =>
                                updateService(
                                  index,
                                  "price",
                                  event.target.value
                                )
                              }
                              placeholder="0"
                            />
                          </div>
                        </label>
                      </div>
                    </article>
                  ))}

                  <button
                    type="button"
                    className="mobile-add-service"
                    onClick={() =>
                      setServices((list) => [...list, emptyService()])
                    }
                  >
                    <span className="mobile-add-plus">+</span>
                    <span>Add another service</span>
                  </button>

                  <div className="mobile-info-card mobile-info-card-compact">
                    <span className="mobile-info-icon">
                      <StepIcon type="clock" />
                    </span>
                    <div>
                      <strong>Keep wait estimates useful</strong>
                      <p>
                        Duration and price are optional. Duration helps
                        estimate how long customers may wait.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="mobile-review">
                  <div className="mobile-review-card">
                    <div className="mobile-review-section-heading">
                      <span>YOUR SHOP DETAILS</span>
                      <button
                        type="button"
                        className="mobile-text-button"
                        onClick={() => {
                          setError("");
                          setStep(1);
                        }}
                      >
                        Edit
                      </button>
                    </div>

                    <div className="mobile-review-shop">
                      <div className="mobile-review-avatar">
                        {name.trim().charAt(0).toUpperCase() || "S"}
                      </div>

                      <div className="mobile-review-shop-info">
                        <strong>{name.trim()}</strong>
                        <p>{address.trim() || "No address added"}</p>
                      </div>
                    </div>

                    <div className="mobile-review-divider" />

                    <div className="mobile-review-section-heading">
                      <span>YOUR SERVICES</span>
                      <button
                        type="button"
                        className="mobile-text-button"
                        onClick={() => {
                          setError("");
                          setStep(2);
                        }}
                      >
                        Edit
                      </button>
                    </div>

                    <div className="mobile-review-service-list">
                      {validServices.map((service, index) => (
                        <div className="mobile-review-service" key={index}>
                          <span className="mobile-review-service-icon">
                            <StepIcon type="check" />
                          </span>

                          <div className="mobile-review-service-info">
                            <strong>{service.name.trim()}</strong>
                            <span>
                              {service.duration
                                ? `${service.duration} min`
                                : "Duration not set"}
                            </span>
                          </div>

                          <span className="mobile-review-price">
                            {service.price !== ""
                              ? `₹${Number(service.price).toLocaleString(
                                  "en-IN"
                                )}`
                              : "Not set"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mobile-success-note">
                    <span className="mobile-success-icon">
                      <StepIcon type="check" />
                    </span>
                    <div>
                      <strong>You're nearly ready</strong>
                      <p>
                        After creating your shop, you can manage the queue
                        and share your QR code with customers.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mobile-form-error" role="alert">
                  <span className="mobile-error-icon">!</span>
                  <p>{error}</p>
                </div>
              )}
            </section>
          </div>

          <footer className="mobile-setup-actions">
            <div className="mobile-action-inner">
             <SlowHint show={slow} />
              <div className="mobile-action-buttons">
                <button
                  type="button"
                  className="mobile-back-button"
                  onClick={goBack}
                  disabled={busy}
                  aria-label={step === 1 ? "Back to home" : "Previous step"}
                >
                  {step === 1 ? (
                    <span className="mobile-back-home">Cancel</span>
                  ) : (
                    <span aria-hidden="true">←</span>
                  )}
                </button>

                                <LoadingButton
                  type="submit"
                  className="mobile-primary-button"
                  loading={busy}
                  loadingText="Creating your shop…"
                >
                  <span>{step === 3 ? "Create my shop" : "Continue"}</span>
                  <StepIcon type="arrow" />
                </LoadingButton>
              </div>

              
            </div>
          </footer>
        </form>
      </div>
    </main>
  );
}
