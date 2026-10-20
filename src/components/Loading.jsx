import { useEffect, useState } from "react";
import "./Loading.css";

export function Spinner({ size = 18, label }) {
  return (
    <span className="ld-spinner-wrap" role="status" aria-live="polite">
      <span className="ld-spinner" style={{ width: size, height: size }} />
      {label && <span>{label}</span>}
    </span>
  );
}

// Drop-in replacement for <button>. Keeps your own className, shows a spinner,
// and blocks double taps while loading.
export function LoadingButton({ loading, loadingText, children, disabled, ...props }) {
  return (
    <button {...props} disabled={disabled || loading} aria-busy={loading}>
      {loading ? (
        <>
          <span className="ld-spinner ld-spinner-inline" aria-hidden="true" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function PageLoader({ text = "Loading…" }) {
  return (
    <div className="ld-page">
      <Spinner size={28} />
      <span>{text}</span>
    </div>
  );
}

// True once `active` has been true for `ms` milliseconds.
export function useSlow(active, ms = 4000) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) {
      setSlow(false);
      return undefined;
    }
    const timer = setTimeout(() => setSlow(true), ms);
    return () => clearTimeout(timer);
  }, [active, ms]);
  return slow;
}

export function SlowHint({ show }) {
  if (!show) return null;
  return (
    <p className="ld-slow" role="status">
      This is taking longer than usual. The server may be waking up, so please
      keep this page open.
    </p>
  );
}