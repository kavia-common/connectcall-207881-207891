import { getApiBaseUrl } from "../config";

/**
 * Small fetch wrapper that supports JSON + bearer token auth.
 */

function buildUrl(path) {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function readErrorMessage(res) {
  try {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const data = await res.json();
      return data?.detail || data?.message || JSON.stringify(data);
    }
    const text = await res.text();
    return text || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

// PUBLIC_INTERFACE
export async function apiRequest(path, { method = "GET", token, body, headers } = {}) {
  /**
   * Perform an API request to the backend.
   * Throws Error on non-2xx responses with an informative message.
   */
  const url = buildUrl(path);

  const finalHeaders = {
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {}),
  };

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const msg = await readErrorMessage(res);
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  // allow empty responses
  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}
