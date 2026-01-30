import React, { useMemo, useState } from "react";
import { signup as apiSignup, login as apiLogin } from "../api/auth";
import { ErrorBanner, Notice } from "../components/Status";
import { useAuth } from "../state/AuthContext";
import { Link, useNavigate } from "react-router-dom";

function isEmailLike(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

// PUBLIC_INTERFACE
export default function SignupScreen() {
  /** Signup screen for new users. */
  const { setSession } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const validationError = useMemo(() => {
    if (!email.trim()) return "Email is required.";
    if (!isEmailLike(email)) return "Enter a valid email address.";
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (confirm !== password) return "Passwords do not match.";
    return "";
  }, [email, password, confirm]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    try {
      await apiSignup({ email: email.trim(), password });
      setNotice("Account created. Logging you in…");

      // Convenience: log in immediately
      const res = await apiLogin({ email: email.trim(), password });
      const token = res?.access_token || res?.token || "";
      const user = res?.user || { email: email.trim() };

      if (!token) {
        throw new Error("Signup succeeded but login token was not returned.");
      }

      setSession({ token, user });
      nav("/app");
    } catch (err) {
      setError(err?.message || "Signup failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="panel" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="panel-header">
          <div className="panel-title">AUTH / SIGNUP</div>
          <div className="spacer" />
          <div className="chip">Neon Onboarding</div>
        </div>
        <div className="panel-body">
          <h2 style={{ marginBottom: 6 }}>Create your account</h2>
          <div className="help" style={{ marginBottom: 14 }}>
            You’ll be able to add contacts and place calls.
          </div>

          <ErrorBanner message={error} />
          <Notice message={notice} />

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
                autoComplete="new-password"
                type="password"
                placeholder="At least 6 characters"
              />
            </div>
            <div className="field">
              <div className="label">Confirm password</div>
              <input
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                type="password"
                placeholder="Repeat password"
              />
            </div>

            <div className="btn-row" style={{ marginTop: 10 }}>
              <button className="btn btn-primary" disabled={busy} type="submit">
                {busy ? "Creating…" : "Create account"}
              </button>
              <Link className="btn" to="/login">
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
