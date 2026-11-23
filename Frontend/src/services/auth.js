// Thin client for the existing Upolabdhi auth backend.
// Set VITE_AUTH_API_URL (e.g. https://your-backend.onrender.com) to connect it.
const API_URL = (import.meta.env.VITE_AUTH_API_URL || "").replace(/\/$/, "");
const STORAGE_KEY = "upolabdhi.session";

export const isAuthConfigured = Boolean(API_URL);

async function request(path, body) {
  if (!API_URL) {
    throw new Error(
      "The sign-in service isn't connected yet. Add VITE_AUTH_API_URL to point at the Upolabdhi backend.",
    );
  }
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("We couldn't reach the server. Check your connection and try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || "Something went wrong. Please try again.");
  }
  return data;
}

function readStorage(store) {
  try {
    const raw = store.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const authService = {
  getStoredSession() {
    if (typeof window === "undefined") return null;
    return readStorage(window.sessionStorage) || readStorage(window.localStorage);
  },

  async login({ email, password, remember }) {
    const data = await request("/api/auth/login", { email, password });
    const session = { token: data.token ?? null, user: data.user ?? { email } };
    const store = remember ? window.localStorage : window.sessionStorage;
    store.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  },

  async register({ name, email, password }) {
    return request("/api/auth/register", { name, email, password });
  },

  logout() {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_KEY);
  },
};
