
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import "./EditShop.css";

const emptyService = () => ({
  name: "",
  duration: "",
  price: "",
});

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

  const paths = {
    back: <path d="m15 18-6-6 6-6M9 12h12" />,
    shop: (
      <>
        <path d="M3 10v10h18V10" />
        <path d="M2 10 4 3h16l2 7" />
        <path d="M2 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 2 0" />
        <path d="M9 20v-5h6v5" />
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
    money: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M7 9h.01M17 15h.01" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" />
        <path d="M10 10v6m4-6v6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5m0-8h.01" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || null}</svg>;
}

export default function EditShop() {
  const { publicId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [services, setServices] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .getStore(publicId)
      .then((store) => {
        if (!active) return;

        setName(store.name || "");
        setAddress(store.address || "");
        setServices(
          (store.services || []).map((service) => ({
            name: service.name || "",
            duration: service.duration_minutes ?? "",
            price: service.price ?? "",
          }))
        );
        setLoaded(true);
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Unable to load shop details.");
          setLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [publicId]);

  const updateService = (index, field, value) => {
    setServices((list) =>
      list.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      )
    );
  };

  function addService() {
    setServices((list) => [...list, emptyService()]);
  }

  function removeService(index) {
    setServices((list) => list.filter((_, i) => i !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError("Shop name must contain at least 2 characters.");
      return;
    }

    const namedServices = services.filter((service) =>
      String(service.name).trim()
    );

    for (const service of namedServices) {
      if (
        service.duration !== "" &&
        (!Number.isFinite(Number(service.duration)) ||
          Number(service.duration) < 1 ||
          Number(service.duration) > 480)
      ) {
        setError("Service duration must be between 1 and 480 minutes.");
        return;
      }

      if (
        service.price !== "" &&
        (!Number.isFinite(Number(service.price)) ||
          Number(service.price) < 0)
      ) {
        setError("Service price must be zero or greater.");
        return;
      }
    }

    setBusy(true);

    try {
      await api.updateStore(publicId, {
        name: trimmedName,
        address: address.trim() || null,
        services: namedServices.map((service) => ({
          name: String(service.name).trim(),
          duration_minutes:
            service.duration !== "" ? Number(service.duration) : null,
          price: service.price !== "" ? Number(service.price) : null,
        })),
      });

      
      navigate(`/shop/${publicId}/manage`);
    } catch (err) {
      setError(err.message || "Unable to save changes. Please try again.");
    } finally {
      setBusy(false);
    }
  }



  if (!loaded) {
    return (
      <main className="es-page">
        <div className="es-loading">
          <span className="es-spinner" />
          <strong>Loading shop details</strong>
          <span>Please wait a moment…</span>
        </div>
      </main>
    );
  }

  return (
    <main className="es-page">
      <div className="es-container">
        <header className="es-header">
          <Link
            className="es-back-link"
            to={`/shop/${publicId}/manage`}
            aria-label="Back to dashboard"
          >
            <Icon name="back" size={20} />
          </Link>

          <div className="es-header-copy">
            <p className="es-eyebrow">SHOP SETTINGS</p>
            <h1>Edit your shop</h1>
            <p className="es-muted">
              Keep your details and services up to date.
            </p>
          </div>
        </header>

        <form className="es-form" onSubmit={handleSubmit}>
          <section className="es-card">
            <div className="es-section-heading">
              <span className="es-section-icon">
                <Icon name="shop" size={21} />
              </span>
              <div>
                <h2>Shop details</h2>
                <p>How customers find and recognise your shop.</p>
              </div>
            </div>

            <div className="es-fields">
              <div className="es-field">
                <label htmlFor="es-shop-name">
                  Shop name <span className="es-required">*</span>
                </label>
                <input
                  id="es-shop-name"
                  className="es-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. The Style Studio"
                  minLength={2}
                  maxLength={150}
                  autoComplete="organization"
                  required
                />
                <span className="es-field-hint">
                  This name is shown to your customers.
                </span>
              </div>

              <div className="es-field">
                <label htmlFor="es-shop-address">
                  <span className="es-label-icon">
                    <Icon name="pin" size={15} />
                  </span>
                  Shop address <span className="es-optional">Optional</span>
                </label>
                <input
                  id="es-shop-address"
                  className="es-input"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Street, area, city"
                  maxLength={300}
                  autoComplete="street-address"
                />
                <span className="es-field-hint">
                  Help customers know where to visit you.
                </span>
              </div>
            </div>
          </section>

          <section className="es-card es-services-card">
            <div className="es-section-heading es-services-heading">
              <span className="es-section-icon">
                <Icon name="check" size={21} />
              </span>
              <div className="es-section-title-wrap">
                <h2>Your services</h2>
                <p>Set the services customers can choose from.</p>
              </div>
              <span className="es-service-count">{services.length}</span>
            </div>

            <div className="es-info-note">
              <Icon name="info" size={18} />
              <p>
                Changes apply to <strong>new customers</strong>. Customers
                already in the queue keep their original service details.
              </p>
            </div>

            {services.length > 0 ? (
              <div className="es-service-list">
                {services.map((service, index) => (
                  <article className="es-service-card" key={index}>
                    <div className="es-service-card-header">
                      <div className="es-service-number">{index + 1}</div>
                      <div className="es-service-card-title">
                        <strong>
                          {service.name.trim() || `Service ${index + 1}`}
                        </strong>
                        <span>Service details</span>
                      </div>

                      <button
                        type="button"
                        className="es-remove-button"
                        onClick={() => removeService(index)}
                        aria-label={`Remove service ${index + 1}`}
                        title="Remove service"
                      >
                        <Icon name="trash" size={18} />
                      </button>
                    </div>

                    <div className="es-service-fields">
                      <div className="es-field es-service-name-field">
                        <label htmlFor={`es-service-name-${index}`}>
                          Service name
                        </label>
                        <input
                          id={`es-service-name-${index}`}
                          className="es-input"
                          placeholder="e.g. Haircut"
                          value={service.name}
                          onChange={(event) =>
                            updateService(index, "name", event.target.value)
                          }
                          maxLength={100}
                        />
                      </div>

                      <div className="es-service-meta-fields">
                        <div className="es-field">
                          <label htmlFor={`es-service-duration-${index}`}>
                            <span className="es-label-icon">
                              <Icon name="clock" size={14} />
                            </span>
                            Duration
                          </label>
                          <div className="es-input-with-suffix">
                            <input
                              id={`es-service-duration-${index}`}
                              className="es-input"
                              type="number"
                              inputMode="numeric"
                              min="1"
                              max="480"
                              step="1"
                              placeholder="30"
                              value={service.duration}
                              onChange={(event) =>
                                updateService(
                                  index,
                                  "duration",
                                  event.target.value
                                )
                              }
                            />
                            <span>min</span>
                          </div>
                        </div>

                        <div className="es-field">
                          <label htmlFor={`es-service-price-${index}`}>
                            <span className="es-label-icon">
                              <Icon name="money" size={14} />
                            </span>
                            Price
                          </label>
                          <div className="es-input-with-prefix">
                            <span>₹</span>
                            <input
                              id={`es-service-price-${index}`}
                              className="es-input"
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              value={service.price}
                              onChange={(event) =>
                                updateService(
                                  index,
                                  "price",
                                  event.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="es-empty-services">
                <div className="es-empty-icon">
                  <Icon name="check" size={24} />
                </div>
                <h3>No services added yet</h3>
                <p>
                  Add the services you offer so customers can choose when
                  joining your queue.
                </p>
              </div>
            )}

            <button
              type="button"
              className="es-add-service-button"
              onClick={addService}
            >
              <span className="es-add-icon">
                <Icon name="plus" size={19} />
              </span>
              <span>
                <strong>Add a service</strong>
                <small>Create another service option</small>
              </span>
              <Icon name="arrow" size={18} />
            </button>
          </section>

          {error && (
            <div className="es-error" role="alert">
              <strong>Couldn't save your changes</strong>
              <span>{error}</span>
            </div>
          )}

          <div className="es-form-actions">
            <Link
              className="es-cancel-button"
              to={`/shop/${publicId}/manage`}
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="es-primary-button es-save-button"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="es-button-spinner" />
                  Saving…
                </>
              ) : (
                <>
                  <Icon name="check" size={19} />
                  Save changes
                </>
              )}
            </button>
          </div>

          <p className="es-bottom-note">
            Your shop settings are saved securely to your LineUp shop.
          </p>
        </form>
      </div>
    </main>
  );
}
