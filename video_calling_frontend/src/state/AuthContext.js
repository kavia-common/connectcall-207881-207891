import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearSession, loadSession, saveSession } from "../api/auth";
import { me as apiMe } from "../api/auth";

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook for accessing authentication state and actions. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides auth state (token/user) and actions (login/logout/refresh). */
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const s = loadSession();
    setToken(s.token || "");
    setUser(s.user || null);
    setBooting(false);
  }, []);

  // Best-effort refresh user profile if token exists
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      if (!token) return;
      try {
        const u = await apiMe(token);
        if (!cancelled) setUser(u?.user || u);
      } catch {
        // token may be invalid; leave as-is
      }
    }
    refresh();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      booting,
      // PUBLIC_INTERFACE
      setSession: ({ token: t, user: u }) => {
        setToken(t || "");
        setUser(u || null);
        saveSession({ token: t || "", user: u || null });
      },
      // PUBLIC_INTERFACE
      logout: () => {
        setToken("");
        setUser(null);
        clearSession();
      },
    }),
    [token, user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
