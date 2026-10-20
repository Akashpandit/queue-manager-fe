import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import AppHeader from "../components/AppHeader.jsx";
import { LoadingButton, SlowHint, useSlow } from "../components/Loading.jsx";
import "./Auth.css";

const perks = [
  "Set up your shop in under two minutes",
  "Customers join by scanning a QR code",
  "Live queue, wait estimates and insights",
];

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/shops";

  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const slow = useSlow(busy);

  if (user) return <Navigate to={redirectTo} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");

    if (isSignup && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      if (isSignup) {
        await signup({
          email: email.trim(),
          password,
          mobile: mobile.trim() || null,
        });
      } else {
        await login({ email: email.trim(), password });
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <AppHeader variant="light" showAction={false} />

      <main className="auth-main">
        <aside className="auth-aside" aria-hidden="true">
          <span className="auth-aside-pill">FOR SHOP OWNERS</span>
          <h2>
            Good service.
            <br />
            <span>Less waiting.</span>
          </h2>
          <ul>
            {perks.map((perk) => (
              <li key={perk}>
                <span className="auth-tick">✓</span>
                {perk}
              </li>
            ))}
          </ul>
        </aside>

        <section className="auth-panel">
          <div className="auth-card">
            <p className="auth-eyebrow">
              {isSignup ? "CREATE ACCOUNT" : "WELCOME BACK"}
            </p>
            <h1>{isSignup ? "Create your account" : "Log in to LineUp"}</h1>
            <p className="auth-subtitle">
              {isSignup
                ? "For shop owners. Your customers never need an account."
                : "Manage your shop's queue from anywhere."}
            </p>

            <form className="auth-form" onSubmit={handleSubmit} noValidate={false}>
              <label className="auth-field">
                <span className="auth-label">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </label>

              {isSignup && (
                <label className="auth-field">
                  <span className="auth-label">
                    Mobile number <em>Optional</em>
                  </span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                  />
                </label>
              )}

              <label className="auth-field">
                <span className="auth-label">Password</span>
                <div className="auth-password">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignup ? "At least 8 characters" : "Your password"}
                    minLength={isSignup ? 8 : undefined}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              {isSignup && (
                <label className="auth-field">
                  <span className="auth-label">Confirm password</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    required
                  />
                </label>
              )}

              {error && (
                <div className="auth-error" role="alert">
                  <span>!</span>
                  <p>{error}</p>
                </div>
              )}

              <SlowHint show={slow} />

              <LoadingButton
                type="submit"
                className="auth-submit"
                loading={busy}
                loadingText={isSignup ? "Creating your account…" : "Logging in…"}
              >
                {isSignup ? "Create account" : "Log in"}
              </LoadingButton>
            </form>

            <p className="auth-switch">
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <Link to="/login" state={location.state}>Log in</Link>
                </>
              ) : (
                <>
                  New here?{" "}
                  <Link to="/signup" state={location.state}>Create an account</Link>
                </>
              )}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}