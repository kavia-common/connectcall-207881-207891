import { apiRequest } from "./client";

const TOKEN_KEY = "connectcall.token";
const USER_KEY = "connectcall.user";

// PUBLIC_INTERFACE
export function loadSession() {
  /** Load persisted session from localStorage. */
  try {
    const token = localStorage.getItem(TOKEN_KEY) || "";
    const userRaw = localStorage.getItem(USER_KEY) || "";
    const user = userRaw ? JSON.parse(userRaw) : null;
    return { token, user };
  } catch {
    return { token: "", user: null };
  }
}

// PUBLIC_INTERFACE
export function saveSession({ token, user }) {
  /** Persist session to localStorage. */
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// PUBLIC_INTERFACE
export function clearSession() {
  /** Remove persisted session. */
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * NOTE: The backend OpenAPI in this environment currently only exposes `/` health check.
 * These endpoints are implemented to match the work-item requirements and are expected
 * to be present in the FastAPI backend container.
 */

// PUBLIC_INTERFACE
export async function signup({ email, password }) {
  /** Sign up a user. Expected backend: POST /auth/signup {email,password} */
  return apiRequest("/auth/signup", { method: "POST", body: { email, password } });
}

// PUBLIC_INTERFACE
export async function login({ email, password }) {
  /** Log in a user. Expected backend: POST /auth/login {email,password} => {access_token,user} */
  return apiRequest("/auth/login", { method: "POST", body: { email, password } });
}

// PUBLIC_INTERFACE
export async function me(token) {
  /** Fetch the current user. Expected backend: GET /auth/me */
  return apiRequest("/auth/me", { method: "GET", token });
}
