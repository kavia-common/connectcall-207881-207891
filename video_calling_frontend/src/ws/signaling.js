import { getWsUrl } from "../config";

/**
 * Minimal WebSocket signaling client for WebRTC.
 *
 * Expected backend behavior:
 * - Accepts a websocket connection at REACT_APP_WS_URL (e.g. ws://host:3001/ws)
 * - Expects JSON messages for offer/answer/candidate/hangup.
 */

// PUBLIC_INTERFACE
export class SignalingClient {
  /** WebSocket signaling client with event callbacks. */
  constructor({ token, onMessage, onStatus }) {
    this.token = token || "";
    this.onMessage = onMessage || (() => {});
    this.onStatus = onStatus || (() => {});
    this.ws = null;
    this._closedByUser = false;
  }

  _makeUrl() {
    const raw = getWsUrl();
    if (!raw) return "";
    // Token is passed as query param for simplicity; backend may alternatively use headers/cookies.
    const u = new URL(raw);
    if (this.token) u.searchParams.set("token", this.token);
    return u.toString();
  }

  // PUBLIC_INTERFACE
  connect() {
    /** Connect to the signaling server. */
    const url = this._makeUrl();
    if (!url) {
      this.onStatus({ state: "error", detail: "REACT_APP_WS_URL is not configured." });
      return;
    }

    this._closedByUser = false;
    this.onStatus({ state: "connecting" });

    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.onStatus({ state: "open" });
    };

    ws.onclose = () => {
      this.onStatus({ state: "closed" });
      this.ws = null;
      if (!this._closedByUser) {
        // Soft reconnect
        setTimeout(() => this.connect(), 800);
      }
    };

    ws.onerror = () => {
      this.onStatus({ state: "error", detail: "WebSocket error" });
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        this.onMessage(data);
      } catch {
        // Ignore non-JSON.
      }
    };
  }

  // PUBLIC_INTERFACE
  close() {
    /** Close the signaling websocket and stop reconnect attempts. */
    this._closedByUser = true;
    if (this.ws) this.ws.close();
    this.ws = null;
  }

  // PUBLIC_INTERFACE
  send(type, payload = {}) {
    /** Send a message to the signaling server. */
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type, ...payload }));
  }
}
