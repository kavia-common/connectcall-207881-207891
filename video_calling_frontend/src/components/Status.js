import React from "react";

// PUBLIC_INTERFACE
export function ErrorBanner({ message }) {
  /** A simple error banner. */
  if (!message) return null;
  return (
    <div className="error" role="alert" aria-live="polite">
      {message}
    </div>
  );
}

// PUBLIC_INTERFACE
export function Notice({ message }) {
  /** A simple informational banner. */
  if (!message) return null;
  return (
    <div className="notice" role="status" aria-live="polite">
      {message}
    </div>
  );
}

// PUBLIC_INTERFACE
export function LoadingRow({ label = "Loading…" }) {
  /** Lightweight loading row. */
  return (
    <div className="help" aria-busy="true">
      {label}
    </div>
  );
}
