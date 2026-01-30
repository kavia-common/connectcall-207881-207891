import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import AppShell from "./screens/AppShell";
import { AuthProvider, useAuth } from "./state/AuthContext";

function Topbar() {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="brand-title">ConnectCall</div>
          <div className="brand-subtitle">Retro WebRTC • Neon Signaling • Contacts</div>
        </div>
        <div className="spacer" />
        <div className="chip">API:{process.env.REACT_APP_API_BASE || "unset"}</div>
      </div>
    </div>
  );
}

function Protected({ children }) {
  const { token, booting } = useAuth();

  if (booting) {
    return (
      <div className="container">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">BOOT</div>
          </div>
          <div className="panel-body">
            <div className="help" aria-busy="true">
              Booting session…
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// PUBLIC_INTERFACE
function App() {
  /** Main application entry with routing + auth provider. */
  return (
    <div className="app">
      <Topbar />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/signup" element={<SignupScreen />} />
            <Route
              path="/app/*"
              element={
                <Protected>
                  <AppShell />
                </Protected>
              }
            />
            <Route
              path="/call"
              element={
                <Protected>
                  <AppShell />
                </Protected>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
