import React, { useMemo, useState } from "react";
import { login as apiLogin } from "../api/auth";
import { ErrorBanner } from "../components/Status";
import { useAuth } from "../state/AuthContext";
import { Link, useNavigate } from "react-router-dom";

function isEmailLike(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

// PUBLIC_INTERFACE
export default function LoginScreen() {
  /** Login screen for existing users. */
  const { setSession } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const validationError = useMemo(() => {
    if (!email.trim()) return "Email is required.";
    if (!isEmailLike(email)) return "Enter a valid email address.";
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return "";
  }, [email, password]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    try {
      const res = await apiLogin({ email: email.trim(), password });
      const token = res?.access_token || res?.token || "";
      const user = res?.user || { email: email.trim() };

      if (!token) {
        throw new Error("Login succeeded but no token was returned by the backend.");
      }

      setSession({ token, user });
      nav("/app");
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="panel" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="panel-header">
          <div className="panel-title">AUTH / LOGIN</div>
          <div className="spacer" />
          <div className="chip">Retro Secure Mode</div>
        </div>
        <div className="panel-body">
          <h2 style={{ marginBottom: 6 }}>Welcome back</h2>
          <div className="help" style={{ marginBottom: 14 }}>
            Sign in to manage contacts and start a call.
          </div>

          <ErrorBanner message={error} />

          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <div className="label">Email</div>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                placeholder="you@domain.com"
              />
            </div>
            <div className="field">
              <div className="label">Password</div>
              <input
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                type="password"
                placeholder="••••••••"
              />
              <div className="help">
                Tip: Use <span className="kbd">Tab</span> to jump fields.
              </div>
            </div>

            <div className="btn-row" style={{ marginTop: 10 }}>
              <button className="btn btn-primary" disabled={busy} type="submit">
                {busy ? "Signing in…" : "Sign in"}
              </button>
              <Link className="btn" to="/signup" aria-label="Go to signup">
                Create account
              </Link>
            </div>

            <div className="footer-hint">
              Backend base: <span className="kbd">{process.env.REACT_APP_API_BASE}</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
