const API_URL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

const TOKEN_KEY = "auth_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(
      err.name === "AbortError"
        ? "The server is taking too long to respond. Please try again."
        : "Cannot reach the server. Check your connection.",
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON body
  }

  if (!res.ok) {
    // An expired or invalid session: forget it and tell the app.
    const isAuthForm =
      path.startsWith("/api/auth/login") || path.startsWith("/api/auth/signup");
    if (res.status === 401 && token && !isAuthForm) {
      clearToken();
      window.dispatchEvent(new Event("auth:expired"));
    }
    const detail = data?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : "Something went wrong";
    throw new ApiError(message, res.status);
  }
  return data;
}

export const api = {
  // auth
  signup: (payload) =>
    request("/api/auth/signup", { method: "POST", body: payload }),
  login: (payload) =>
    request("/api/auth/login", { method: "POST", body: payload }),
  me: () => request("/api/auth/me"),
  myStores: () => request("/api/my/stores"),
  claimStore: (publicId, ownerKey) =>
    request(`/api/stores/${publicId}/claim`, {
      method: "POST",
      body: { owner_key: ownerKey },
    }),

  // public
  getStore: (publicId) => request(`/api/stores/${publicId}`),
  getQueue: (publicId) => request(`/api/stores/${publicId}/queue`),
  joinQueue: (publicId, payload) =>
    request(`/api/stores/${publicId}/queue/join`, {
      method: "POST",
      body: payload,
    }),
  getEntry: (entryKey) => request(`/api/queue/entries/${entryKey}`),
  cancelEntry: (entryKey) =>
    request(`/api/queue/entries/${entryKey}/cancel`, { method: "POST" }),

  // owner (needs login)
  createStore: (payload) =>
    request("/api/stores", { method: "POST", body: payload }),
  updateStore: (publicId, payload) =>
    request(`/api/stores/${publicId}`, { method: "PATCH", body: payload }),
  manage: (publicId) => request(`/api/stores/${publicId}/queue/manage`),
  walkIn: (publicId, payload) =>
    request(`/api/stores/${publicId}/queue/walk-in`, {
      method: "POST",
      body: payload,
    }),
  callNext: (publicId) =>
    request(`/api/stores/${publicId}/queue/next`, { method: "POST" }),
  markDone: (publicId, token) =>
    request(`/api/stores/${publicId}/queue/${token}/done`, { method: "POST" }),
  markNoShow: (publicId, token) =>
    request(`/api/stores/${publicId}/queue/${token}/no-show`, {
      method: "POST",
    }),
  overview: (days) => request(`/api/my/overview?days=${days}`),
  analytics: (publicId, days) =>
    request(`/api/stores/${publicId}/analytics?days=${days}`),
};
