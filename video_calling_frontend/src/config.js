/**
 * Runtime configuration for the frontend.
 * Values are provided via CRA environment variables (REACT_APP_*).
 */

const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "";
const WS_URL = process.env.REACT_APP_WS_URL || "";

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns the configured REST API base URL (e.g. https://host:3001). */
  return API_BASE.replace(/\/+$/, "");
}

// PUBLIC_INTERFACE
export function getWsUrl() {
  /** Returns the configured signaling WebSocket URL (e.g. ws://host:3001/ws). */
  return WS_URL;
}

// PUBLIC_INTERFACE
export function getFrontendUrl() {
  /** Returns the configured frontend URL (used for redirects if needed). */
  return (process.env.REACT_APP_FRONTEND_URL || "").replace(/\/+$/, "");
}
