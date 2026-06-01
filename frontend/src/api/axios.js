// src/api/axios.js
// Pre-configured Axios instance for all API calls

import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
});

let csrfToken = null;
let fetchingCsrf = null;

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken;
  if (fetchingCsrf) return fetchingCsrf;

  fetchingCsrf = (async () => {
    try {
      // Use standard axios to avoid infinite recursion with the interceptor
      const response = await axios.get(`${baseURL}/csrf-token`, {
        withCredentials: true,
      });
      csrfToken = response.data.data.csrfToken;
      return csrfToken;
    } catch (err) {
      console.error("Failed to fetch CSRF token:", err);
      return null;
    } finally {
      fetchingCsrf = null;
    }
  })();

  return fetchingCsrf;
}

api.interceptors.request.use(
  async (config) => {
    // 1. Add authorization header
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Attach CSRF token for state-changing requests
    if (config.method && !["get", "head", "options"].includes(config.method.toLowerCase())) {
      const currentToken = await ensureCsrfToken();
      if (currentToken) {
        config.headers["X-CSRF-Token"] = currentToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle CSRF token validation failure by refreshing token and retrying once
    if (
      error.response &&
      error.response.status === 403 &&
      error.response.data?.error?.code === "CSRF_ERROR" &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      csrfToken = null; // Invalidate the in-memory token
      const newToken = await ensureCsrfToken();
      if (newToken) {
        originalRequest.headers["X-CSRF-Token"] = newToken;
        return api(originalRequest);
      }
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth-expired"));
    }
    return Promise.reject(error);
  }
);

export default api;
