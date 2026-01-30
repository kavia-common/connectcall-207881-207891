import React from "react";
import { Navigate, Route, Routes, Link, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import ContactsScreen from "./ContactsScreen";
import CallScreen from "./CallScreen";

// PUBLIC_INTERFACE
export default function AppShell() {
  /** Authenticated part of the app: contacts + call screen. */
  const { user, logout } = useAuth();
  const loc = useLocation();

  return (
    <div className="container">
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <div className="panel-title">CONTROL ROOM</div>
          <div className="spacer" />
          <div className="chip">{user?.email ? `user:${user.email}` : "user:authenticated"}</div>
          <button className="btn btn-danger" onClick={logout}>
            Logout
          </button>
        </div>
        <div className="panel-body">
          <div className="btn-row">
            <Link className="btn btn-primary" to="/app" aria-current={loc.pathname === "/app" ? "page" : undefined}>
              Contacts
            </Link>
            <Link className="btn" to="/call" aria-current={loc.pathname === "/call" ? "page" : undefined}>
              Call console
            </Link>
          </div>
          <div className="help" style={{ marginTop: 10 }}>
            Use the contacts list to start a call with a target handle.
          </div>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<ContactsScreen />} />
        <Route path="/call" element={<CallScreen />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </div>
  );
}
