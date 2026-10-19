const API_URL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, ownerKey } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(ownerKey ? { "X-Owner-Key": ownerKey } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection.", 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON body
  }

  if (!res.ok) {
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
  // public
  createStore: (payload) =>
    request("/api/stores", { method: "POST", body: payload }),
  getStore: (publicId) => request(`/api/stores/${publicId}`),
  getQueue: (publicId) => request(`/api/stores/${publicId}/queue`),
  joinQueue: (publicId, payload) =>
    request(`/api/stores/${publicId}/queue/join`, { method: "POST", body: payload }),
  getEntry: (entryKey) => request(`/api/queue/entries/${entryKey}`),
  cancelEntry: (entryKey) =>
    request(`/api/queue/entries/${entryKey}/cancel`, { method: "POST" }),

  // owner
  manage: (publicId, ownerKey) =>
    request(`/api/stores/${publicId}/queue/manage`, { ownerKey }),
  updateStore: (publicId, ownerKey, payload) =>
    request(`/api/stores/${publicId}`, { method: "PATCH", body: payload, ownerKey }),
  walkIn: (publicId, ownerKey, payload) =>
    request(`/api/stores/${publicId}/queue/walk-in`, {
      method: "POST",
      body: payload,
      ownerKey,
    }),
  callNext: (publicId, ownerKey) =>
    request(`/api/stores/${publicId}/queue/next`, { method: "POST", ownerKey }),
  markDone: (publicId, ownerKey, token) =>
    request(`/api/stores/${publicId}/queue/${token}/done`, {
      method: "POST",
      ownerKey,
    }),
  markNoShow: (publicId, ownerKey, token) =>
    request(`/api/stores/${publicId}/queue/${token}/no-show`, {
      method: "POST",
      ownerKey,
    }),
};